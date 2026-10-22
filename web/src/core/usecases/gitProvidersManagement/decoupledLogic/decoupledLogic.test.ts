import { describe, expect, it } from "vitest";
import type { GitProvidersConfig } from "core/ports/OnyxiaApi/GitProvidersConfig";
import {
    createMigratedPersistedGitConfig,
    parseGitConfigStr,
    serializeGitConfig
} from "./persistedGitConfig";
import { getFavoriteProviderId } from "./favoriteProvider";
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

describe("persistedGitConfig", () => {
    it("round trips", () => {
        const gitConfig = {
            personalAccessTokenByProviderId: { "github.com": "ghp_x" },
            favoriteProviderId: null
        };

        expect(
            parseGitConfigStr({ gitConfigStr: serializeGitConfig({ gitConfig }) })
        ).toStrictEqual(gitConfig);
    });

    it("can't read back something else", () => {
        expect(parseGitConfigStr({ gitConfigStr: "{" })).toBe(undefined);
        expect(parseGitConfigStr({ gitConfigStr: "{}" })).toBe(undefined);
    });

    it("migrates the former GitHub token to the github.com provider", () => {
        expect(
            createMigratedPersistedGitConfig({
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
                ],
                githubPersonalAccessToken: " ghp_x "
            })
        ).toStrictEqual({
            personalAccessTokenByProviderId: { gh: "ghp_x" },
            favoriteProviderId: null
        });
    });

    it("doesn't migrate without github.com or without a token", () => {
        expect(
            createMigratedPersistedGitConfig({
                providers: [
                    createProvider({
                        id: "ghes",
                        type: "github",
                        url: "https://github.acme.org"
                    })
                ],
                githubPersonalAccessToken: "ghp_x"
            })
        ).toBe(undefined);
        expect(
            createMigratedPersistedGitConfig({
                providers: [
                    createProvider({
                        id: "gh",
                        type: "github",
                        url: "https://github.com"
                    })
                ],
                githubPersonalAccessToken: ""
            })
        ).toBe(undefined);
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
