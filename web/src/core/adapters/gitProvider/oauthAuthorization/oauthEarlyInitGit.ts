export const BROADCAST_CHANNEL_NAME = "onyxia:git-oauth-callback";
export const GIT_OAUTH_CALLBACK_PATH = "git/oauth/callback";

/**
 * The popup can be shared by several authorizations (see authorizeInPopup): Onyxia
 * closes it, or sends it to the next provider, once it got the callback. Closing itself
 * is the way out when Onyxia lost its handle on the popup (COOP).
 */
const SELF_CLOSE_DELAY_MS = 2_000;

export function oauthEarlyInitGit(): { shouldLoadApp: boolean } {
    if (window.location.pathname === `/${GIT_OAUTH_CALLBACK_PATH}`) {
        const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        channel.postMessage({ url: window.location.href });
        channel.close();
        setTimeout(() => window.close(), SELF_CLOSE_DELAY_MS);
        return { shouldLoadApp: false };
    }
    return { shouldLoadApp: true };
}
