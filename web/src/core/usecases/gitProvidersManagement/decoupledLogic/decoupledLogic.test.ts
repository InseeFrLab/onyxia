import { describe, expect, it } from "vitest";
import type { GitProvidersConfig } from "core/ports/OnyxiaApi/GitProvidersConfig";
import {
    createMigratedPersistedGitConfig,
    parseGitConfigStr,
    serializeGitConfig
} from "./persistedGitConfig";
import { getFavoriteProviderId } from "./favoriteProvider";
import { createUserProvider } from "./userProviders";
import { assert } from "tsafe/assert";
import {
    collectServiceCredentialsMarkers,
    createServiceCredentialsMarker,
    parseServiceCredentialsMarker,
    replaceServiceCredentialsMarkers
} from "./serviceCredentialsMarkers";
import type { Stringifyable } from "core/tools/Stringifyable";

const createProvider = (params: {
    id: string;
    type: GitProvidersConfig.ProviderType;
    url: string;
}): GitProvidersConfig.Provider => ({
    ...params,
    displayName: params.id,
    logoUrl: undefined,
    documentation: undefined,
    authentication: {
        ui: { type: "personal-access-token" },
        service: { type: "personal-access-token" }
    }
});

const createGitProvidersConfig = (params: {
    providers: GitProvidersConfig.Provider[];
    disallowUserToAddProviders?: boolean;
}): GitProvidersConfig => ({
    description: undefined,
    providers: params.providers,
    disallowUserToAddProviders: params.disallowUserToAddProviders ?? false
});

describe("persistedGitConfig", () => {
    it("round trips", () => {
        const gitConfig = {
            personalAccessTokenByProviderId: { "github.com": "ghp_x" },
            favoriteProviderId: null,
            userProviders: [
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

    it("reads back what the previous versions saved, without user providers", () => {
        expect(
            parseGitConfigStr({
                gitConfigStr: JSON.stringify({
                    personalAccessTokenByProviderId: {},
                    favoriteProviderId: "gh"
                })
            })
        ).toStrictEqual({
            personalAccessTokenByProviderId: {},
            favoriteProviderId: "gh",
            userProviders: []
        });
    });

    it("can't read back something else", () => {
        expect(parseGitConfigStr({ gitConfigStr: "{" })).toBe(undefined);
        expect(parseGitConfigStr({ gitConfigStr: "{}" })).toBe(undefined);
    });

    it("migrates the former GitHub token to the github.com provider", () => {
        expect(
            createMigratedPersistedGitConfig({
                gitProvidersConfig: createGitProvidersConfig({
                    providers: [
                        createProvider({
                            id: "gitlab",
                            type: "gitlab",
                            url: "https://git.example.com"
                        }),
                        createProvider({
                            id: "gh",
                            type: "github",
                            url: "https://github.com"
                        })
                    ]
                }),
                githubPersonalAccessToken: " ghp_x "
            })
        ).toStrictEqual({
            personalAccessTokenByProviderId: { gh: "ghp_x" },
            favoriteProviderId: null,
            userProviders: []
        });
    });

    it("adds github.com on behalf of the user when it isn't configured", () => {
        expect(
            createMigratedPersistedGitConfig({
                gitProvidersConfig: createGitProvidersConfig({ providers: [] }),
                githubPersonalAccessToken: "ghp_x"
            })
        ).toStrictEqual({
            personalAccessTokenByProviderId: { "user:github.com": "ghp_x" },
            favoriteProviderId: null,
            userProviders: [
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
                gitProvidersConfig: createGitProvidersConfig({
                    providers: [
                        createProvider({
                            id: "ghes",
                            type: "github",
                            url: "https://github.acme.org"
                        })
                    ],
                    disallowUserToAddProviders: true
                }),
                githubPersonalAccessToken: "ghp_x"
            })
        ).toBe(undefined);
        expect(
            createMigratedPersistedGitConfig({
                gitProvidersConfig: createGitProvidersConfig({
                    providers: [
                        createProvider({
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

describe("createUserProvider", () => {
    const gitProvidersConfig = createGitProvidersConfig({
        providers: [
            createProvider({ id: "lab", type: "gitlab", url: "https://git.example.com" })
        ]
    });

    it("normalizes the url and defaults the name to the host", () => {
        expect(
            createUserProvider({
                type: "gitlab",
                url: " GitLab.com/ ",
                displayName: " ",
                gitProvidersConfig,
                userProviders: []
            })
        ).toStrictEqual({
            isSuccess: true,
            userProvider: {
                id: "user:gitlab.com",
                type: "gitlab",
                url: "https://gitlab.com",
                displayName: "gitlab.com"
            }
        });
    });

    it("keeps a port and a path", () => {
        const result = createUserProvider({
            type: "forgejo",
            url: "http://localhost:3000/forgejo/",
            displayName: "Mine",
            gitProvidersConfig,
            userProviders: []
        });

        assert(result.isSuccess);

        expect(result.userProvider.id).toBe("user:localhost:3000/forgejo");
        expect(result.userProvider.url).toBe("http://localhost:3000/forgejo");
        expect(result.userProvider.displayName).toBe("Mine");
    });

    it("refuses what isn't an http(s) url", () => {
        for (const url of [
            "",
            "ssh://git@gitlab.com",
            "https://user:pw@gitlab.com",
            "gitlab"
        ]) {
            expect(
                createUserProvider({
                    type: "gitlab",
                    url,
                    displayName: "",
                    gitProvidersConfig,
                    userProviders: []
                })
            ).toStrictEqual({ isSuccess: false, error: "invalid url" });
        }
    });

    it("only accepts bitbucket.org for Bitbucket", () => {
        const create = (url: string) =>
            createUserProvider({
                type: "bitbucket",
                url,
                displayName: "",
                gitProvidersConfig,
                userProviders: []
            });

        expect(create("bitbucket.org/")).toMatchObject({
            isSuccess: true,
            userProvider: { id: "user:bitbucket.org", url: "https://bitbucket.org" }
        });
        expect(create("https://bitbucket.acme.org")).toStrictEqual({
            isSuccess: false,
            error: "invalid url"
        });
    });

    it("refuses a url already configured, by the admin or by the user", () => {
        expect(
            createUserProvider({
                type: "gitlab",
                url: "https://git.example.com/",
                displayName: "",
                gitProvidersConfig,
                userProviders: []
            })
        ).toStrictEqual({ isSuccess: false, error: "already configured" });

        expect(
            createUserProvider({
                type: "github",
                url: "github.com",
                displayName: "",
                gitProvidersConfig,
                userProviders: [
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

describe("getFavoriteProviderId", () => {
    const providerIds = ["a", "b", "c"];

    it("keeps the explicit choice, even when not connected", () => {
        expect(
            getFavoriteProviderId({
                providerIds,
                connectedProviderIds: ["a"],
                favoriteProviderId_persisted: "c"
            })
        ).toBe("c");
    });

    it("defaults to the first connected provider", () => {
        expect(
            getFavoriteProviderId({
                providerIds,
                connectedProviderIds: ["c", "b"],
                favoriteProviderId_persisted: null
            })
        ).toBe("b");
    });

    it("ignores a choice no longer configured", () => {
        expect(
            getFavoriteProviderId({
                providerIds,
                connectedProviderIds: [],
                favoriteProviderId_persisted: "removed"
            })
        ).toBe(undefined);
    });
});

describe("serviceCredentialsMarkers", () => {
    const token = createServiceCredentialsMarker({
        kind: "access-token",
        providerId: "git.example.com:8443"
    });
    const refreshToken = createServiceCredentialsMarker({
        kind: "refresh-token",
        providerId: "forgejo"
    });

    it("parses back a marker, the provider id can contain ':'", () => {
        expect(parseServiceCredentialsMarker(token)).toStrictEqual({
            kind: "access-token",
            providerId: "git.example.com:8443"
        });
        expect(parseServiceCredentialsMarker("ghp_xxx")).toBe(undefined);
        expect(
            parseServiceCredentialsMarker("onyxia-git-created-at-launch:other:gitlab")
        ).toBe(undefined);
    });

    const helmValues: Record<string, Stringifyable> = {
        git: {
            token,
            providers: [
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
                providers: [
                    { url: "https://forgejo", credentials: { refreshToken: "refresh" } },
                    { url: "https://github.com", credentials: { token: "ghp_xxx" } }
                ]
            },
            other: [1, true, null]
        });
    });
});
