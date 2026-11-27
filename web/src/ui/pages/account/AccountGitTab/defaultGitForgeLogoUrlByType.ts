import type { GitForgesConfig } from "core/ports/OnyxiaApi/GitForgesConfig";
import gitHubLogoUrl from "ui/assets/img/gitForges/github.png";
import gitLabLogoUrl from "ui/assets/img/gitForges/gitlab.png";
import forgejoLogoUrl from "ui/assets/img/gitForges/forgejo.svg";
import bitbucketLogoUrl from "ui/assets/img/gitForges/bitbucket.svg";

/** When the configuration has no logo, and for the forges added by the user */
export const defaultGitForgeLogoUrlByType: Record<GitForgesConfig.ForgeType, string> = {
    github: gitHubLogoUrl,
    gitlab: gitLabLogoUrl,
    forgejo: forgejoLogoUrl,
    bitbucket: bitbucketLogoUrl
};
