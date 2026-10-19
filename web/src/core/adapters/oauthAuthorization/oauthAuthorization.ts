import { z } from "zod";
import {
    OAuthAuthorizationError,
    type OAuthAuthorization
} from "core/ports/OAuthAuthorization";

/**
 * The provider redirects the popup back to Onyxia on redirectUri. That page doesn't load
 * the app (see handleOAuthAuthorizationCallback in main.tsx): it forwards its URL to the
 * opener through a BroadcastChannel and closes itself. Nothing is persisted: the PKCE
 * verifier stays in memory.
 */

const BROADCAST_CHANNEL_NAME = "onyxia:git-oauth-callback";

const POPUP_TIMEOUT_MS = 5 * 60_000;

export function createOAuthAuthorization(params: {
    redirectUri: string;
}): OAuthAuthorization {
    const { redirectUri } = params;

    return {
        redirectUri,
        authorizeInPopup: async ({ getAuthorizationUrl }) => {
            // NOTE: Opened synchronously, before any await, so that the browser still
            // considers we are handling the user's click and doesn't block the popup.
            const popup = window.open(
                "",
                "onyxia-git-oauth",
                "popup,width=600,height=750"
            );

            if (popup === null) {
                throw new OAuthAuthorizationError(
                    "popup blocked",
                    "The authorization popup was blocked by the browser, allow popups for this site"
                );
            }

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
                popup.close();
            }

            const code = callbackUrl.searchParams.get("code");

            if (callbackUrl.searchParams.has("error") || code === null) {
                throw new OAuthAuthorizationError(
                    "denied",
                    `Authorization denied: ${callbackUrl.searchParams.get("error_description") ?? callbackUrl.searchParams.get("error") ?? "no code returned"}`
                );
            }

            return { code, codeVerifier };
        }
    };
}

/**
 * To be called, instead of loading the app, when the current page is the OAuth callback
 * (GIT_OAUTH_CALLBACK_PATH).
 */
export function handleOAuthAuthorizationCallback(): void {
    const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    channel.postMessage({ url: window.location.href });
    channel.close();

    window.close();
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

        // TODO(phase 1): A provider sending `Cross-Origin-Opener-Policy: same-origin`
        // makes popup.closed true as soon as the popup navigates to it. If one does, rely
        // on the timeout and the BroadcastChannel only.
        const intervalId = setInterval(() => {
            if (!popup.closed) {
                return;
            }

            clearInterval(intervalId);

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
