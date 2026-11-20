import { describe, expect, it } from "vitest";
import {
    type GitProvidersConfig,
    getProviderCredentialsKey
} from "core/ports/OnyxiaApi/GitProvidersConfig";
import {
    createEmptyPersistedGitConfig,
    getReconciledPersistedGitConfig
} from "./persistedGitConfig";

const createProvider = (url: string): GitProvidersConfig.Provider => ({
    id: "GitLab",
    type: "gitlab",
    url,
    displayName: "GitLab",
    logoUrl: undefined,
    authentication: {
        ui: { type: "personal-access-token" },
        service: { type: "personal-access-token" }
    }
});

describe(getReconciledPersistedGitConfig.name, () => {
    it("records what a PAT saved by a previous version is for", () => {
        const provider = createProvider("https://gitlab.example.com");

        expect(
            getReconciledPersistedGitConfig({
                gitConfig: {
                    ...createEmptyPersistedGitConfig(),
                    personalAccessTokenByProviderId: { GitLab: "glpat" }
                },
                providers: [provider]
            })
        ).toStrictEqual({
            ...createEmptyPersistedGitConfig(),
            personalAccessTokenByProviderId: { GitLab: "glpat" },
            credentialsKeyByProviderId: { GitLab: getProviderCredentialsKey(provider) }
        });
    });

    it("drops the PAT of a provider the admin moved to another url", () => {
        expect(
            getReconciledPersistedGitConfig({
                gitConfig: {
                    ...createEmptyPersistedGitConfig(),
                    personalAccessTokenByProviderId: { GitLab: "glpat" },
                    credentialsKeyByProviderId: {
                        GitLab: getProviderCredentialsKey(
                            createProvider("https://gitlab.example.com")
                        )
                    }
                },
                providers: [createProvider("https://other.example.com")]
            })
        ).toStrictEqual(createEmptyPersistedGitConfig());
    });

    it("changes nothing when the provider didn't change", () => {
        const provider = createProvider("https://gitlab.example.com");

        expect(
            getReconciledPersistedGitConfig({
                gitConfig: {
                    ...createEmptyPersistedGitConfig(),
                    personalAccessTokenByProviderId: { GitLab: "glpat" },
                    credentialsKeyByProviderId: {
                        GitLab: getProviderCredentialsKey(provider)
                    }
                },
                providers: [provider]
            })
        ).toBeUndefined();
    });
});
