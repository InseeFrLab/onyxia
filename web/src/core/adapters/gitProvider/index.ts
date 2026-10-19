import type { GitProvider } from "core/ports/GitProvider";
import type { GitProvidersConfig } from "core/ports/OnyxiaApi/GitProvidersConfig";
import { createGitLabProvider } from "./gitLab";
import { createForgejoProvider } from "./forgejo";
import { createGitHubProvider } from "./gitHub";

export function createGitProvider(params: {
    config: GitProvidersConfig.Provider;
}): GitProvider {
    const { config } = params;

    switch (config.type) {
        case "gitlab":
            return createGitLabProvider({ config });
        case "forgejo":
            return createForgejoProvider({ config });
        case "github":
            return createGitHubProvider({ config });
    }
}
