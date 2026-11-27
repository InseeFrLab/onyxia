export const BROADCAST_CHANNEL_NAME = "onyxia:git-oauth-callback";
export const GIT_OAUTH_CALLBACK_PATH = "git/oauth/callback";

/**
 * The popup can be shared by several authorizations (see authorizeInPopup): Onyxia
 * closes it, or sends it to the next forge, once it got the callback. Closing itself
 * is the way out when Onyxia lost its handle on the popup (COOP).
 */
const SELF_CLOSE_DELAY_MS = 2_000;

export function oauthEarlyInitGit(params: {
    /** import.meta.env.BASE_URL, the app may be served under a sub path: "/onyxia/" */
    BASE_URL: string;
}): { shouldLoadApp: boolean } {
    const { BASE_URL } = params;

    const basePath = BASE_URL.endsWith("/") ? BASE_URL : `${BASE_URL}/`;

    if (window.location.pathname === `${basePath}${GIT_OAUTH_CALLBACK_PATH}`) {
        const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        channel.postMessage({ url: window.location.href });
        channel.close();
        setTimeout(() => window.close(), SELF_CLOSE_DELAY_MS);
        return { shouldLoadApp: false };
    }
    return { shouldLoadApp: true };
}
