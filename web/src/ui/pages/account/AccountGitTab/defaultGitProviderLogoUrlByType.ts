import type { GitProvidersConfig } from "core/ports/OnyxiaApi/GitProvidersConfig";
import gitHubLogoUrl from "ui/assets/img/gitProviders/github.png";
import gitLabLogoUrl from "ui/assets/img/gitProviders/gitlab.png";
import forgejoLogoUrl from "ui/assets/img/gitProviders/forgejo.svg";
import bitbucketLogoUrl from "ui/assets/img/gitProviders/bitbucket.svg";

/** When the configuration has no logo, and for the providers added by the user */
export const defaultGitProviderLogoUrlByType: Record<
    GitProvidersConfig.ProviderType,
    string
> = {
    github: gitHubLogoUrl,
    gitlab: gitLabLogoUrl,
    forgejo: forgejoLogoUrl,
    bitbucket: bitbucketLogoUrl
};
