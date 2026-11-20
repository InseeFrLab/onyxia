import { z } from "zod";
import { assert, type Equals, id } from "tsafe";
import {
    type GitProvidersConfig,
    getProviderCredentialsKey
} from "core/ports/OnyxiaApi/GitProvidersConfig";
import { createUserProvider, type UserProvider } from "./userProviders";

/**
 * The user's own Git configuration, serialized into the single `gitConfigStr` user config
 * entry (persisted in the secret manager). The OAuth sessions aren't here, they are in
 * the GitSessionStore.
 */
export type PersistedGitConfig = {
    /** Keyed by provider id, for the providers whose ui authentication is a PAT */
    personalAccessTokenByProviderId: Record<string, string>;
    /** Added by the user in Account > Git, after the ones of GIT_PROVIDERS */
    userProviders: UserProvider[];
    /**
     * What each PAT was given for, see getProviderCredentialsKey. Recorded when Git
     * loads, a PAT whose provider changed since is dropped.
     */
    credentialsKeyByProviderId: Record<string, string>;
};

const zPersistedGitConfig = (() => {
    type TargetType = PersistedGitConfig;

    const zTargetType = z.object({
        personalAccessTokenByProviderId: z.record(z.string(), z.string()),
        // NOTE: Absent from what the previous versions saved.
        userProviders: z
            .array(
                z.object({
                    id: z.string(),
                    type: z.enum(["gitlab", "forgejo", "github", "bitbucket"]),
                    url: z.string(),
                    displayName: z.string()
                })
            )
            .optional()
            .transform(userProviders => userProviders ?? []),
        // NOTE: Absent from what the previous versions saved.
        credentialsKeyByProviderId: z
            .record(z.string(), z.string())
            .optional()
            .transform(record => record ?? {})
    });

    type InferredType = z.infer<typeof zTargetType>;

    assert<Equals<TargetType, InferredType>>();

    return id<z.ZodType<TargetType, z.ZodTypeDef, unknown>>(zTargetType);
})();

export function createEmptyPersistedGitConfig(): PersistedGitConfig {
    return {
        personalAccessTokenByProviderId: {},
        userProviders: [],
        credentialsKeyByProviderId: {}
    };
}

/**
 * Drops the PATs given for a provider that changed since (url, type...), and records what
 * the others are for. undefined: nothing to change.
 */
export function getReconciledPersistedGitConfig(params: {
    gitConfig: PersistedGitConfig;
    providers: GitProvidersConfig.Provider[];
}): PersistedGitConfig | undefined {
    const { gitConfig, providers } = params;

    const personalAccessTokenByProviderId: Record<string, string> = {};
    const credentialsKeyByProviderId: Record<string, string> = {};

    for (const [providerId, personalAccessToken] of Object.entries(
        gitConfig.personalAccessTokenByProviderId
    )) {
        const provider = providers.find(({ id }) => id === providerId);

        if (provider === undefined) {
            // NOTE: Kept, the provider may be back (GIT_PROVIDERS, users allowed again).
            personalAccessTokenByProviderId[providerId] = personalAccessToken;

            const credentialsKey = gitConfig.credentialsKeyByProviderId[providerId];

            if (credentialsKey !== undefined) {
                credentialsKeyByProviderId[providerId] = credentialsKey;
            }

            continue;
        }

        const credentialsKey = getProviderCredentialsKey(provider);
        const credentialsKey_recorded = gitConfig.credentialsKeyByProviderId[providerId];

        // NOTE: Recorded by a previous version: what it was given for is unknown.
        if (
            credentialsKey_recorded !== undefined &&
            credentialsKey_recorded !== credentialsKey
        ) {
            continue;
        }

        personalAccessTokenByProviderId[providerId] = personalAccessToken;
        credentialsKeyByProviderId[providerId] = credentialsKey;
    }

    const gitConfig_reconciled: PersistedGitConfig = {
        ...gitConfig,
        personalAccessTokenByProviderId,
        credentialsKeyByProviderId
    };

    return serializeGitConfig({ gitConfig: gitConfig_reconciled }) ===
        serializeGitConfig({ gitConfig })
        ? undefined
        : gitConfig_reconciled;
}

/**
 * Returns undefined when what is stored can't be read back. The caller is expected to
 * tell the user instead of silently starting over (it would drop their tokens).
 */
export function parseGitConfigStr(params: {
    gitConfigStr: string;
}): PersistedGitConfig | undefined {
    const { gitConfigStr } = params;

    let parsedValue: unknown;

    try {
        parsedValue = JSON.parse(gitConfigStr);
    } catch {
        return undefined;
    }

    const result = zPersistedGitConfig.safeParse(parsedValue);

    if (!result.success) {
        return undefined;
    }

    return result.data;
}

export function serializeGitConfig(params: { gitConfig: PersistedGitConfig }): string {
    const { gitConfig } = params;

    return JSON.stringify(gitConfig);
}

/**
 * The PAT of the former "GitHub personal access token" field goes to the github.com
 * provider, once, when gitConfigStr doesn't exist yet: the one of GIT_PROVIDERS, or one
 * added on behalf of the user when there is none and the users can add theirs. The former
 * field is left as is so that going back to a previous version of Onyxia is possible.
 * undefined: nothing to migrate.
 */
export function createMigratedPersistedGitConfig(params: {
    gitProvidersConfig: GitProvidersConfig;
    githubPersonalAccessToken: string | null;
}): PersistedGitConfig | undefined {
    const { gitProvidersConfig, githubPersonalAccessToken } = params;

    const { providers } = gitProvidersConfig;

    if (githubPersonalAccessToken === null || githubPersonalAccessToken.trim() === "") {
        return undefined;
    }

    const provider_gitHub = providers.find(
        provider =>
            provider.type === "github" &&
            new URL(provider.url).host === "github.com" &&
            provider.authentication.ui.type === "personal-access-token"
    );

    if (provider_gitHub !== undefined) {
        return {
            ...createEmptyPersistedGitConfig(),
            personalAccessTokenByProviderId: {
                [provider_gitHub.id]: githubPersonalAccessToken.trim()
            }
        };
    }

    if (gitProvidersConfig.disallowUserToAddProviders) {
        return undefined;
    }

    const result = createUserProvider({
        type: "github",
        url: "https://github.com",
        displayName: "",
        gitProvidersConfig,
        userProviders: []
    });

    if (!result.isSuccess) {
        // NOTE: github.com is in GIT_PROVIDERS, with an authentication other than a PAT.
        return undefined;
    }

    const { userProvider } = result;

    return {
        ...createEmptyPersistedGitConfig(),
        personalAccessTokenByProviderId: {
            [userProvider.id]: githubPersonalAccessToken.trim()
        },
        userProviders: [userProvider]
    };
}
