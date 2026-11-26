import { z } from "zod";
import { OAuthAuthorizationError } from "core/ports/GitProvider";
import { BROADCAST_CHANNEL_NAME, GIT_OAUTH_CALLBACK_PATH } from "./oauthEarlyInitGit";

export type OAuthAuthorization = {
    /** <onyxia>/git/oauth/callback, to register in the OAuth applications (Onyxia's and the services') */
    redirectUri: string;
    /**
     * Must be called synchronously from the click handler (the window is
     * opened before any await). Rejects with OAuthAuthorizationError if the popup is
     * blocked, closed, denied or times out.
     */
    authorizeInPopup: (params: {
        getAuthorizationUrl: (params: { state: string; codeChallenge: string }) => string;
    }) => Promise<{ code: string; codeVerifier: string }>;
};

const POPUP_TIMEOUT_MS = 5 * 60_000;

/**
 * A provider page sending `Cross-Origin-Opener-Policy: same-origin` (gitlab.com's
 * Cloudflare challenge for instance) severs the popup from Onyxia: popup.closed turns
 * true while the user is still on it. It happens as soon as the popup navigates there,
 * a user doesn't close the popup that fast: a "closed" popup within this delay is
 * assumed severed, the BroadcastChannel and the timeout are then the only way out.
 */
const COOP_SEVERANCE_DELAY_MS = 5_000;

export function createOAuthAuthorization(params: {
    BASE_URL: string;
}): OAuthAuthorization {
    const { BASE_URL } = params;

    /**
     * A browser lets a click open one popup: the authorizations started from the same
     * click (one per Git provider at launch) go one after the other in the same popup,
     * closed once the last one is done.
     */
    let sharedPopup:
        | { popup: Window; prPrevious: Promise<void>; pendingCount: number }
        | undefined = undefined;

    return {
        redirectUri: (() => {
            const basePath = BASE_URL.endsWith("/") ? BASE_URL : `${BASE_URL}/`;

            return new URL(`${basePath}${GIT_OAUTH_CALLBACK_PATH}`, location.origin).href;
        })(),
        authorizeInPopup: params => {
            const { getAuthorizationUrl } = params;

            if (sharedPopup === undefined) {
                // NOTE: Opened synchronously, before any await, so that the browser still
                // considers we are handling the user's click and doesn't block the popup.
                const popup = window.open(
                    "",
                    "onyxia-git-oauth",
                    "popup,width=600,height=750"
                );

                if (popup === null) {
                    return Promise.reject(
                        new OAuthAuthorizationError(
                            "popup blocked",
                            "The authorization popup was blocked by the browser, allow popups for this site"
                        )
                    );
                }

                sharedPopup = { popup, prPrevious: Promise.resolve(), pendingCount: 0 };
            }

            const shared = sharedPopup;

            shared.pendingCount++;

            const prResult = shared.prPrevious.then(() =>
                authorizeInOpenPopup({ popup: shared.popup, getAuthorizationUrl })
            );

            shared.prPrevious = prResult.then(
                () => {},
                () => {}
            );

            return prResult.finally(() => {
                shared.pendingCount--;

                if (shared.pendingCount !== 0) {
                    return;
                }

                shared.popup.close();

                if (sharedPopup === shared) {
                    sharedPopup = undefined;
                }
            });
        }
    };
}

async function authorizeInOpenPopup(params: {
    popup: Window;
    getAuthorizationUrl: (params: { state: string; codeChallenge: string }) => string;
}): Promise<{ code: string; codeVerifier: string }> {
    const { popup, getAuthorizationUrl } = params;

    // NOTE: Closed by the user during a previous authorization, or severed by COOP
    // (see COOP_SEVERANCE_DELAY_MS): it can't be navigated anymore.
    if (popup.closed) {
        throw new OAuthAuthorizationError(
            "popup closed",
            "The authorization popup was closed before completion"
        );
    }

    {
        const state = generateRandomString();
        const codeVerifier = generateRandomString();

        const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);

        let callbackUrl: URL;

        try {
            const prCallbackUrl = waitForCallbackUrl({ channel, popup, state });

            popup.location.href = getAuthorizationUrl({
                state,
                codeChallenge: await computeCodeChallenge(codeVerifier)
            });

            callbackUrl = await prCallbackUrl;
        } finally {
            channel.close();
        }

        const code = callbackUrl.searchParams.get("code");

        if (callbackUrl.searchParams.has("error") || code === null) {
            const providerError =
                callbackUrl.searchParams.get("error_description") ??
                callbackUrl.searchParams.get("error") ??
                "no code returned";

            throw new OAuthAuthorizationError(
                "denied",
                `Authorization denied: ${providerError}`,
                providerError
            );
        }

        return { code, codeVerifier };
    }
}

function waitForCallbackUrl(params: {
    channel: BroadcastChannel;
    popup: Window;
    state: string;
}): Promise<URL> {
    const { channel, popup, state } = params;

    return new Promise<URL>((resolve, reject) => {
        const cleanup = () => {
            clearInterval(intervalId);
            clearTimeout(timeoutId);
            channel.onmessage = null;
        };

        channel.onmessage = event => {
            const url = (() => {
                try {
                    return new URL(z.object({ url: z.string() }).parse(event.data).url);
                } catch {
                    return undefined;
                }
            })();

            // NOTE: Ignore callbacks from other flows (e.g. in another tab)
            if (url === undefined || url.searchParams.get("state") !== state) {
                return;
            }

            cleanup();
            resolve(url);
        };

        const startTime = Date.now();

        const intervalId = setInterval(() => {
            if (!popup.closed) {
                return;
            }

            clearInterval(intervalId);

            // NOTE: Severed by COOP, see COOP_SEVERANCE_DELAY_MS.
            if (Date.now() - startTime < COOP_SEVERANCE_DELAY_MS) {
                return;
            }

            // NOTE: Let a chance to the message posted right before close to arrive.
            setTimeout(() => {
                cleanup();
                reject(
                    new OAuthAuthorizationError(
                        "popup closed",
                        "The authorization popup was closed before completion"
                    )
                );
            }, 500);
        }, 500);

        const timeoutId = setTimeout(() => {
            cleanup();
            reject(new OAuthAuthorizationError("timeout", "The authorization timed out"));
        }, POPUP_TIMEOUT_MS);
    });
}

function generateRandomString(): string {
    return base64UrlEncode(crypto.getRandomValues(new Uint8Array(32)));
}

async function computeCodeChallenge(codeVerifier: string): Promise<string> {
    const digest = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(codeVerifier)
    );

    return base64UrlEncode(new Uint8Array(digest));
}

function base64UrlEncode(bytes: Uint8Array): string {
    return btoa(String.fromCharCode(...bytes))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}
