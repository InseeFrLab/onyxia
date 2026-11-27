import { describe, expect, it } from "vitest";
import type { GitForgesConfig } from "core/ports/OnyxiaApi/GitForgesConfig";
import {
    createMigratedPersistedGitConfig,
    parseGitConfigStr,
    serializeGitConfig
} from "./persistedGitConfig";
import { createUserForge } from "./userForges";
import { getRepositoryFullPath } from "./repositoryUrl";
import { assert } from "tsafe/assert";
import {
    collectServiceCredentialsMarkers,
    createServiceCredentialsMarker,
    parseServiceCredentialsMarker,
    replaceServiceCredentialsMarkers
} from "./serviceCredentialsMarkers";
import type { Stringifyable } from "core/tools/Stringifyable";

const createForge = (params: {
    id: string;
    type: GitForgesConfig.ForgeType;
    url: string;
}): GitForgesConfig.Forge => ({
    ...params,
    displayName: params.id,
    logoUrl: undefined,
    authentication: {
        ui: { type: "personal-access-token" },
        service: { type: "personal-access-token" }
    }
});

const createGitForgesConfig = (params: {
    forges: GitForgesConfig.Forge[];
    disallowUserToAddForges?: boolean;
}): GitForgesConfig => ({
    description: undefined,
    forges: params.forges,
    disallowUserToAddForges: params.disallowUserToAddForges ?? false
});

describe("persistedGitConfig", () => {
    it("round trips", () => {
        const gitConfig = {
            personalAccessTokenByForgeId: { "github.com": "ghp_x" },
            userForges: [
                {
                    id: "user:gitlab.com",
                    type: "gitlab" as const,
                    url: "https://gitlab.com",
                    displayName: "gitlab.com"
                }
            ]
        };

        expect(
            parseGitConfigStr({ gitConfigStr: serializeGitConfig({ gitConfig }) })
        ).toStrictEqual(gitConfig);
    });

    it("reads back what the previous versions saved: no user forges, a favorite", () => {
        expect(
            parseGitConfigStr({
                gitConfigStr: JSON.stringify({
                    personalAccessTokenByForgeId: {},
                    favoriteForgeId: "gh"
                })
            })
        ).toStrictEqual({
            personalAccessTokenByForgeId: {},
            userForges: []
        });
    });

    it("can't read back something else", () => {
        expect(parseGitConfigStr({ gitConfigStr: "{" })).toBe(undefined);
        expect(parseGitConfigStr({ gitConfigStr: "{}" })).toBe(undefined);
    });

    it("migrates the former GitHub token to the github.com forge", () => {
        expect(
            createMigratedPersistedGitConfig({
                gitForgesConfig: createGitForgesConfig({
                    forges: [
                        createForge({
                            id: "gitlab",
                            type: "gitlab",
                            url: "https://git.example.com"
                        }),
                        createForge({
                            id: "gh",
                            type: "github",
                            url: "https://github.com"
                        })
                    ]
                }),
                githubPersonalAccessToken: " ghp_x "
            })
        ).toStrictEqual({
            personalAccessTokenByForgeId: { gh: "ghp_x" },
            userForges: []
        });
    });

    it("adds github.com on behalf of the user when it isn't configured", () => {
        expect(
            createMigratedPersistedGitConfig({
                gitForgesConfig: createGitForgesConfig({ forges: [] }),
                githubPersonalAccessToken: "ghp_x"
            })
        ).toStrictEqual({
            personalAccessTokenByForgeId: { "user:github.com": "ghp_x" },
            userForges: [
                {
                    id: "user:github.com",
                    type: "github",
                    url: "https://github.com",
                    displayName: "github.com"
                }
            ]
        });
    });

    it("doesn't migrate when the user can't add github.com, or without a token", () => {
        expect(
            createMigratedPersistedGitConfig({
                gitForgesConfig: createGitForgesConfig({
                    forges: [
                        createForge({
                            id: "ghes",
                            type: "github",
                            url: "https://github.acme.org"
                        })
                    ],
                    disallowUserToAddForges: true
                }),
                githubPersonalAccessToken: "ghp_x"
            })
        ).toBe(undefined);
        expect(
            createMigratedPersistedGitConfig({
                gitForgesConfig: createGitForgesConfig({
                    forges: [
                        createForge({
                            id: "gh",
                            type: "github",
                            url: "https://github.com"
                        })
                    ]
                }),
                githubPersonalAccessToken: ""
            })
        ).toBe(undefined);
    });
});

describe("createUserForge", () => {
    const gitForgesConfig = createGitForgesConfig({
        forges: [
            createForge({ id: "lab", type: "gitlab", url: "https://git.example.com" })
        ]
    });

    it("normalizes the url and defaults the name to the host", () => {
        expect(
            createUserForge({
                type: "gitlab",
                url: " GitLab.com/ ",
                displayName: " ",
                gitForgesConfig,
                userForges: []
            })
        ).toStrictEqual({
            isSuccess: true,
            userForge: {
                id: "user:gitlab.com",
                type: "gitlab",
                url: "https://gitlab.com",
                displayName: "gitlab.com"
            }
        });
    });

    it("keeps a port and a path", () => {
        const result = createUserForge({
            type: "forgejo",
            url: "http://localhost:3000/forgejo/",
            displayName: "Mine",
            gitForgesConfig,
            userForges: []
        });

        assert(result.isSuccess);

        expect(result.userForge.id).toBe("user:localhost:3000/forgejo");
        expect(result.userForge.url).toBe("http://localhost:3000/forgejo");
        expect(result.userForge.displayName).toBe("Mine");
    });

    it("refuses what isn't an http(s) url", () => {
        for (const url of [
            "",
            "ssh://git@gitlab.com",
            "https://user:pw@gitlab.com",
            "ftp://gitlab.com"
        ]) {
            expect(
                createUserForge({
                    type: "gitlab",
                    url,
                    displayName: "",
                    gitForgesConfig,
                    userForges: []
                })
            ).toStrictEqual({ isSuccess: false, error: "invalid url" });
        }
    });

    it("only accepts bitbucket.org for Bitbucket", () => {
        const create = (url: string) =>
            createUserForge({
                type: "bitbucket",
                url,
                displayName: "",
                gitForgesConfig,
                userForges: []
            });

        expect(create("bitbucket.org/")).toMatchObject({
            isSuccess: true,
            userForge: { id: "user:bitbucket.org", url: "https://bitbucket.org" }
        });
        expect(create("https://bitbucket.acme.org")).toStrictEqual({
            isSuccess: false,
            error: "invalid url"
        });
    });

    it("refuses a url already configured, by the admin or by the user", () => {
        expect(
            createUserForge({
                type: "gitlab",
                url: "https://git.example.com/",
                displayName: "",
                gitForgesConfig,
                userForges: []
            })
        ).toStrictEqual({ isSuccess: false, error: "already configured" });

        expect(
            createUserForge({
                type: "github",
                url: "github.com",
                displayName: "",
                gitForgesConfig,
                userForges: [
                    {
                        id: "user:github.com",
                        type: "github",
                        url: "https://github.com",
                        displayName: "github.com"
                    }
                ]
            })
        ).toStrictEqual({ isSuccess: false, error: "already configured" });
    });
});

describe("serviceCredentialsMarkers", () => {
    const token = createServiceCredentialsMarker({
        kind: "access-token",
        forgeId: "git.example.com:8443"
    });
    const refreshToken = createServiceCredentialsMarker({
        kind: "refresh-token",
        forgeId: "forgejo"
    });

    it("parses back a marker, the forge id can contain ':'", () => {
        expect(parseServiceCredentialsMarker(token)).toStrictEqual({
            kind: "access-token",
            forgeId: "git.example.com:8443"
        });
        expect(parseServiceCredentialsMarker("ghp_xxx")).toBe(undefined);
        expect(
            parseServiceCredentialsMarker("onyxia-git-created-at-launch:other:gitlab")
        ).toBe(undefined);
    });

    const helmValues: Record<string, Stringifyable> = {
        git: {
            token,
            forges: [
                { url: "https://forgejo", credentials: { refreshToken } },
                { url: "https://github.com", credentials: { token: "ghp_xxx" } }
            ]
        },
        other: [1, true, null]
    };

    it("collects the markers in depth, each once", () => {
        expect(
            collectServiceCredentialsMarkers({ ...helmValues, again: token })
        ).toStrictEqual([token, refreshToken]);
    });

    it("replaces the markers in depth, keeps everything else", () => {
        expect(
            replaceServiceCredentialsMarkers({
                value: helmValues,
                valueByMarker: { [token]: "glpat", [refreshToken]: "refresh" }
            })
        ).toStrictEqual({
            git: {
                token: "glpat",
                forges: [
                    { url: "https://forgejo", credentials: { refreshToken: "refresh" } },
                    { url: "https://github.com", credentials: { token: "ghp_xxx" } }
                ]
            },
            other: [1, true, null]
        });
    });
});

describe("getRepositoryFullPath", () => {
    it("is the path of the clone url under the forge", () => {
        expect(
            getRepositoryFullPath({
                forgeUrl: "https://git.example.com",
                repositoryUrl: " https://git.example.com/group/sub/project.git "
            })
        ).toBe("group/sub/project");
        expect(
            getRepositoryFullPath({
                forgeUrl: "https://example.com/gitlab",
                repositoryUrl: "https://example.com/gitlab/group/project"
            })
        ).toBe("group/project");
    });

    it("is undefined for another forge or no repository", () => {
        expect(
            getRepositoryFullPath({
                forgeUrl: "https://git.example.com",
                repositoryUrl: "https://git.example.com.evil.org/a/b.git"
            })
        ).toBe(undefined);
        expect(
            getRepositoryFullPath({
                forgeUrl: "https://git.example.com",
                repositoryUrl: "https://git.example.com/group"
            })
        ).toBe(undefined);
    });
});
