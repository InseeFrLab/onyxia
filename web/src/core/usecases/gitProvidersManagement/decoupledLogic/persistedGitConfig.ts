import { z } from "zod";
import { assert, type Equals, id } from "tsafe";
import type { GitProvidersConfig } from "core/ports/OnyxiaApi/GitProvidersConfig";

/**
 * The user's own Git configuration, serialized into the single `gitConfigStr` user config
 * entry (persisted in the secret manager). The OAuth sessions aren't here, they are in
 * the GitSessionStore.
 */
export type PersistedGitConfig = {
    /** Keyed by provider id, for the providers whose ui authentication is a PAT */
    personalAccessTokenByProviderId: Record<string, string>;
    /** The user's explicit choice. null, and not undefined, so that it round trips through JSON. */
    favoriteProviderId: string | null;
};

const zPersistedGitConfig = (() => {
    type TargetType = PersistedGitConfig;

    const zTargetType = z.object({
        personalAccessTokenByProviderId: z.record(z.string(), z.string()),
        favoriteProviderId: z.string().nullable()
    });

    type InferredType = z.infer<typeof zTargetType>;

    assert<Equals<TargetType, InferredType>>();

    return id<z.ZodType<TargetType>>(zTargetType);
})();

export function createEmptyPersistedGitConfig(): PersistedGitConfig {
    return {
        personalAccessTokenByProviderId: {},
        favoriteProviderId: null
    };
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
 * provider, once, when gitConfigStr doesn't exist yet. The former field is left as is so
 * that going back to a previous version of Onyxia is possible.
 * undefined: nothing to migrate.
 */
export function createMigratedPersistedGitConfig(params: {
    providers: GitProvidersConfig.Provider[];
    githubPersonalAccessToken: string | null;
}): PersistedGitConfig | undefined {
    const { providers, githubPersonalAccessToken } = params;

    if (githubPersonalAccessToken === null || githubPersonalAccessToken.trim() === "") {
        return undefined;
    }

    const provider_gitHub = providers.find(
        provider =>
            provider.type === "github" &&
            new URL(provider.url).host === "github.com" &&
            provider.authentication.ui.type === "personal-access-token"
    );

    if (provider_gitHub === undefined) {
        return undefined;
    }

    return {
        ...createEmptyPersistedGitConfig(),
        personalAccessTokenByProviderId: {
            [provider_gitHub.id]: githubPersonalAccessToken.trim()
        }
    };
}
