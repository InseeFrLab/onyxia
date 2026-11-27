import type { CreateGitForge } from "core/ports/GitForge";
import {
    type GitForgesConfig,
    getForgeCredentialsKey
} from "core/ports/OnyxiaApi/GitForgesConfig";
import type { RawGitForge } from "./RawGitForge";
import { createGitLabForge } from "./gitLab";
import { createForgejoForge } from "./forgejo";
import { createGitHubForge } from "./gitHub";
import { createBitbucketForge } from "./bitbucket";
import { createOAuthAuthorization } from "./oauthAuthorization";
import { createGitSessionStore } from "./gitSessionStore";
import { createGitForgeFromRaw } from "./createGitForgeFromRaw";

/** userSub: the Onyxia user, the OAuth sessions are kept per user */
export function createCreateGitForge(params: { userSub: string }): CreateGitForge {
    const { userSub } = params;

    const oauthAuthorization = createOAuthAuthorization({
        BASE_URL: import.meta.env.BASE_URL
    });

    const gitSessionStore = createGitSessionStore({ userSub });

    return ({ config }) =>
        createGitForgeFromRaw({
            rawGitForge: createRawGitForge({ config }),
            // NOTE: A session isn't reused once the forge's endpoint changed.
            forgeId: getForgeCredentialsKey(config),
            oauthAuthorization,
            gitSessionStore
        });
}

function createRawGitForge(params: { config: GitForgesConfig.Forge }): RawGitForge {
    const { config } = params;

    switch (config.type) {
        case "gitlab":
            return createGitLabForge({ config });
        case "forgejo":
            return createForgejoForge({ config });
        case "github":
            return createGitHubForge({ config });
        case "bitbucket":
            return createBitbucketForge({ config });
    }
}
