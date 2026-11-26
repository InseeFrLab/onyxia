import type { CreateGitProvider } from "core/ports/GitProvider";
import {
    type GitProvidersConfig,
    getProviderCredentialsKey
} from "core/ports/OnyxiaApi/GitProvidersConfig";
import type { RawGitProvider } from "./RawGitProvider";
import { createGitLabProvider } from "./gitLab";
import { createForgejoProvider } from "./forgejo";
import { createGitHubProvider } from "./gitHub";
import { createBitbucketProvider } from "./bitbucket";
import { createOAuthAuthorization } from "./oauthAuthorization";
import { createGitSessionStore } from "./gitSessionStore";
import { createGitProviderFromRaw } from "./createGitProviderFromRaw";

/** userSub: the Onyxia user, the OAuth sessions are kept per user */
export function createCreateGitProvider(params: { userSub: string }): CreateGitProvider {
    const { userSub } = params;

    const oauthAuthorization = createOAuthAuthorization({
        BASE_URL: import.meta.env.BASE_URL
    });

    const gitSessionStore = createGitSessionStore({ userSub });

    return ({ config }) =>
        createGitProviderFromRaw({
            rawGitProvider: createRawGitProvider({ config }),
            // NOTE: A session isn't reused once the provider's endpoint changed.
            providerId: getProviderCredentialsKey(config),
            oauthAuthorization,
            gitSessionStore
        });
}

function createRawGitProvider(params: {
    config: GitProvidersConfig.Provider;
}): RawGitProvider {
    const { config } = params;

    switch (config.type) {
        case "gitlab":
            return createGitLabProvider({ config });
        case "forgejo":
            return createForgejoProvider({ config });
        case "github":
            return createGitHubProvider({ config });
        case "bitbucket":
            return createBitbucketProvider({ config });
    }
}
