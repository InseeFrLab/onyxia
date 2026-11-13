import { describe, it, expect, afterEach, vi } from "vitest";
import { createHash } from "node:crypto";
import { createOAuthAuthorization } from "./oauthAuthorization";
import { OAuthAuthorizationError } from "core/ports/OAuthAuthorization";

const redirectUri = "https://onyxia.example.com/git/oauth/callback";

function mockPopup(params: {
    callbackSearch: (state: string) => string;
    /** Delay before the provider redirects to the callback page */
    callbackDelayMs?: number;
    /** popup.closed turns true this long after the navigation, the callback still comes */
    closedAfterMs?: number;
}) {
    const { callbackDelayMs = 10, closedAfterMs } = params;

    vi.stubGlobal("window", {
        open: () => {
            const popup = {
                closed: false,
                close: () => {
                    popup.closed = true;
                },
                location: {
                    set href(value: string) {
                        const state = new URL(value).searchParams.get("state")!;

                        if (closedAfterMs !== undefined) {
                            setTimeout(() => {
                                popup.closed = true;
                            }, closedAfterMs);
                        }

                        // Simulates the provider redirecting to the Onyxia callback page.
                        setTimeout(() => {
                            const channel = new BroadcastChannel(
                                "onyxia:git-oauth-callback"
                            );
                            channel.postMessage({
                                url: `${redirectUri}?${params.callbackSearch(state)}`
                            });
                            channel.close();
                        }, callbackDelayMs);
                    }
                }
            };
            return popup;
        }
    });
}

describe("createOAuthAuthorization", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.useRealTimers();
    });

    /** prNavigated resolves once the popup was sent to the provider */
    const createNavigationSpy = () => {
        let onNavigated: () => void = () => {};

        const prNavigated = new Promise<void>(resolve => (onNavigated = resolve));

        return {
            prNavigated,
            getAuthorizationUrl: ({ state }: { state: string }) => {
                // NOTE: The popup's href is set right after this returns.
                queueMicrotask(onNavigated);
                return `https://git.example.com/authorize?state=${state}`;
            }
        };
    };

    const useFakeTimers = () =>
        vi.useFakeTimers({
            toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date"]
        });

    it("returns the code and a verifier matching the challenge", async () => {
        mockPopup({ callbackSearch: state => `code=the-code&state=${state}` });

        let codeChallenge: string | undefined;

        const { code, codeVerifier } = await createOAuthAuthorization({
            redirectUri
        }).authorizeInPopup({
            getAuthorizationUrl: params => {
                codeChallenge = params.codeChallenge;
                return `https://git.example.com/authorize?state=${params.state}`;
            }
        });

        expect(code).toBe("the-code");
        expect(createHash("sha256").update(codeVerifier).digest("base64url")).toBe(
            codeChallenge
        );
    });

    it("fails when the user denies", async () => {
        mockPopup({
            callbackSearch: state =>
                `error=invalid_scope&error_description=unknown+scope&state=${state}`
        });

        await expect(
            createOAuthAuthorization({ redirectUri }).authorizeInPopup({
                getAuthorizationUrl: ({ state }) =>
                    `https://git.example.com/authorize?state=${state}`
            })
        ).rejects.toMatchObject({ reason: "denied", providerError: "unknown scope" });
    });

    it("waits for the callback when a COOP header severs the popup", async () => {
        useFakeTimers();

        // NOTE: Severed right away, the user completes the authorization 8s later.
        mockPopup({
            callbackSearch: state => `code=the-code&state=${state}`,
            closedAfterMs: 100,
            callbackDelayMs: 8_000
        });

        const { getAuthorizationUrl, prNavigated } = createNavigationSpy();

        const prAuthorization = createOAuthAuthorization({
            redirectUri
        }).authorizeInPopup({ getAuthorizationUrl });

        // NOTE: The challenge is computed for real (crypto.subtle) before navigating.
        await prNavigated;
        await vi.advanceTimersByTimeAsync(9_000);

        expect((await prAuthorization).code).toBe("the-code");
    });

    it("reports a popup the user closed", async () => {
        useFakeTimers();

        mockPopup({
            callbackSearch: state => `code=the-code&state=${state}`,
            closedAfterMs: 6_000,
            callbackDelayMs: 60_000
        });

        const { getAuthorizationUrl, prNavigated } = createNavigationSpy();

        const prError = createOAuthAuthorization({ redirectUri })
            .authorizeInPopup({ getAuthorizationUrl })
            .catch(error => error);

        await prNavigated;
        await vi.advanceTimersByTimeAsync(7_000);

        expect(await prError).toMatchObject({ reason: "popup closed" });
    });

    it("fails explicitly when the popup is blocked", async () => {
        vi.stubGlobal("window", { open: () => null });

        const error = await createOAuthAuthorization({ redirectUri })
            .authorizeInPopup({
                getAuthorizationUrl: () => "https://git.example.com/authorize"
            })
            .catch(error => error);

        expect(error).toBeInstanceOf(OAuthAuthorizationError);
        expect(error.reason).toBe("popup blocked");
    });
});
