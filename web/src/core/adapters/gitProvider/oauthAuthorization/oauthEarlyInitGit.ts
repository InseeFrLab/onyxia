export const BROADCAST_CHANNEL_NAME = "onyxia:git-oauth-callback";
export const GIT_OAUTH_CALLBACK_PATH = "git/oauth/callback";

export function oauthEarlyInitGit(): { shouldLoadApp: boolean } {
    if (window.location.pathname === `/${GIT_OAUTH_CALLBACK_PATH}`) {
        const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        channel.postMessage({ url: window.location.href });
        channel.close();
        window.close();
        return { shouldLoadApp: false };
    }
    return { shouldLoadApp: true };
}
