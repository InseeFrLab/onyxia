import { z } from "zod";
import { assert, type Equals, id } from "tsafe";
import type { GitForgesConfig } from "core/ports/OnyxiaApi/GitForgesConfig";
import { createUserForge, type UserForge } from "./userForges";

/**
 * The user's own Git configuration, serialized into the single `gitConfigStr` user config
 * entry (persisted in the secret manager). The OAuth sessions aren't here, they are in
 * the GitSessionStore.
 */
export type PersistedGitConfig = {
    /** Keyed by forge id, for the forges whose ui authentication is a PAT */
    personalAccessTokenByForgeId: Record<string, string>;
    /** Added by the user in Account > Git, after the ones of GIT_FORGES */
    userForges: UserForge[];
};

const zPersistedGitConfig = (() => {
    type TargetType = PersistedGitConfig;

    const zTargetType = z.object({
        personalAccessTokenByForgeId: z.record(z.string(), z.string()),
        // NOTE: Absent from what the previous versions saved.
        userForges: z
            .array(
                z.object({
                    id: z.string(),
                    type: z.enum(["gitlab", "forgejo", "github", "bitbucket"]),
                    url: z.string(),
                    displayName: z.string()
                })
            )
            .optional()
            .transform(userForges => userForges ?? [])
    });

    type InferredType = z.infer<typeof zTargetType>;

    assert<Equals<TargetType, InferredType>>();

    return id<z.ZodType<TargetType, z.ZodTypeDef, unknown>>(zTargetType);
})();

export function createEmptyPersistedGitConfig(): PersistedGitConfig {
    return {
        personalAccessTokenByForgeId: {},
        userForges: []
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
 * forge, once, when gitConfigStr doesn't exist yet: the one of GIT_FORGES, or one
 * added on behalf of the user when there is none and the users can add theirs. The former
 * field is left as is so that going back to a previous version of Onyxia is possible.
 * undefined: nothing to migrate.
 */
export function createMigratedPersistedGitConfig(params: {
    gitForgesConfig: GitForgesConfig;
    githubPersonalAccessToken: string | null;
}): PersistedGitConfig | undefined {
    const { gitForgesConfig, githubPersonalAccessToken } = params;

    const { forges } = gitForgesConfig;

    if (githubPersonalAccessToken === null || githubPersonalAccessToken.trim() === "") {
        return undefined;
    }

    const forge_gitHub = forges.find(
        forge =>
            forge.type === "github" &&
            new URL(forge.url).host === "github.com" &&
            forge.authentication.ui.type === "personal-access-token"
    );

    if (forge_gitHub !== undefined) {
        return {
            ...createEmptyPersistedGitConfig(),
            personalAccessTokenByForgeId: {
                [forge_gitHub.id]: githubPersonalAccessToken.trim()
            }
        };
    }

    if (gitForgesConfig.disallowUserToAddForges) {
        return undefined;
    }

    const result = createUserForge({
        type: "github",
        url: "https://github.com",
        displayName: "",
        gitForgesConfig,
        userForges: []
    });

    if (!result.isSuccess) {
        // NOTE: github.com is in GIT_FORGES, with an authentication other than a PAT.
        return undefined;
    }

    const { userForge } = result;

    return {
        ...createEmptyPersistedGitConfig(),
        personalAccessTokenByForgeId: {
            [userForge.id]: githubPersonalAccessToken.trim()
        },
        userForges: [userForge]
    };
}
