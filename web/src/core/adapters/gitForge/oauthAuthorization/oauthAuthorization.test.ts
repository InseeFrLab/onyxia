import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createHash } from "node:crypto";
import { OAuthAuthorizationError } from "core/ports/GitForge";
import { createOAuthAuthorization } from "./oauthAuthorization";

const redirectUri = "https://onyxia.example.com/git/oauth/callback";

function mockPopup(params: {
    callbackSearch: (state: string) => string;
    /** Delay before the forge redirects to the callback page */
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

                        // Simulates the forge redirecting to the Onyxia callback page.
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
    beforeEach(() => {
        vi.stubGlobal("location", new URL("https://onyxia.example.com/account"));
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.useRealTimers();
    });

    /** prNavigated resolves once the popup was sent to the forge */
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

    it.each([
        {
            BASE_URL: "/",
            href: "https://onyxia.example.com/account",
            expected: "https://onyxia.example.com/git/oauth/callback"
        },
        {
            BASE_URL: "",
            href: "https://onyxia.example.com/account",
            expected: "https://onyxia.example.com/git/oauth/callback"
        },
        {
            BASE_URL: "/onyxia",
            href: "https://onyxia.example.com/onyxia/account",
            expected: "https://onyxia.example.com/onyxia/git/oauth/callback"
        },
        {
            BASE_URL: "/onyxia/",
            href: "https://onyxia.example.com/onyxia/account",
            expected: "https://onyxia.example.com/onyxia/git/oauth/callback"
        },
        {
            BASE_URL: "/onyxia/",
            href: "http://localhost:5173/onyxia/account",
            expected: "http://localhost:5173/onyxia/git/oauth/callback"
        }
    ])("builds the callback URL $expected", ({ BASE_URL, href, expected }) => {
        vi.stubGlobal("location", new URL(href));

        expect(createOAuthAuthorization({ BASE_URL }).redirectUri).toBe(expected);
    });

    it("returns the code and a verifier matching the challenge", async () => {
        mockPopup({ callbackSearch: state => `code=the-code&state=${state}` });

        let codeChallenge: string | undefined;

        const { code, codeVerifier } = await createOAuthAuthorization({
            BASE_URL: "/"
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
            createOAuthAuthorization({ BASE_URL: "/" }).authorizeInPopup({
                getAuthorizationUrl: ({ state }) =>
                    `https://git.example.com/authorize?state=${state}`
            })
        ).rejects.toMatchObject({ reason: "denied", forgeError: "unknown scope" });
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
            BASE_URL: "/"
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

        const prError = createOAuthAuthorization({ BASE_URL: "/" })
            .authorizeInPopup({ getAuthorizationUrl })
            .catch(error => error);

        await prNavigated;
        await vi.advanceTimersByTimeAsync(7_000);

        expect(await prError).toMatchObject({ reason: "popup closed" });
    });

    it("runs the authorizations of the same click one after the other in one popup", async () => {
        const events: string[] = [];

        let openCount = 0;

        vi.stubGlobal("window", {
            open: () => {
                openCount++;

                const popup = {
                    closed: false,
                    close: () => {
                        events.push("close");
                        popup.closed = true;
                    },
                    location: {
                        set href(value: string) {
                            const url = new URL(value);
                            const state = url.searchParams.get("state")!;

                            events.push(`navigate ${url.host}`);

                            setTimeout(() => {
                                const channel = new BroadcastChannel(
                                    "onyxia:git-oauth-callback"
                                );
                                channel.postMessage({
                                    url: `${redirectUri}?code=code-of-${url.host}&state=${state}`
                                });
                                channel.close();
                            }, 10);
                        }
                    }
                };

                return popup;
            }
        });

        const oauthAuthorization = createOAuthAuthorization({ BASE_URL: "/" });

        // NOTE: Both synchronously, as getServiceGitCredentials does.
        const [prGitLab, prForgejo] = ["gitlab.example.com", "forgejo.example.com"].map(
            host =>
                oauthAuthorization.authorizeInPopup({
                    getAuthorizationUrl: ({ state }) =>
                        `https://${host}/authorize?state=${state}`
                })
        );

        expect((await prGitLab).code).toBe("code-of-gitlab.example.com");
        expect((await prForgejo).code).toBe("code-of-forgejo.example.com");

        expect(openCount).toBe(1);
        expect(events).toStrictEqual([
            "navigate gitlab.example.com",
            "navigate forgejo.example.com",
            "close"
        ]);

        // NOTE: A later click opens a new popup.
        await oauthAuthorization.authorizeInPopup({
            getAuthorizationUrl: ({ state }) =>
                `https://gitlab.example.com/authorize?state=${state}`
        });

        expect(openCount).toBe(2);
    });

    it("doesn't wait for a popup the user closed during a previous authorization", async () => {
        useFakeTimers();

        mockPopup({
            callbackSearch: state => `code=the-code&state=${state}`,
            closedAfterMs: 6_000,
            callbackDelayMs: 60_000
        });

        const oauthAuthorization = createOAuthAuthorization({ BASE_URL: "/" });

        const { getAuthorizationUrl, prNavigated } = createNavigationSpy();

        const prFirst = oauthAuthorization
            .authorizeInPopup({ getAuthorizationUrl })
            .catch(error => error);
        const prSecond = oauthAuthorization
            .authorizeInPopup({
                getAuthorizationUrl: ({ state }) =>
                    `https://git.example.com/authorize?state=${state}`
            })
            .catch(error => error);

        await prNavigated;
        await vi.advanceTimersByTimeAsync(7_000);

        expect(await prFirst).toMatchObject({ reason: "popup closed" });
        expect(await prSecond).toMatchObject({ reason: "popup closed" });
    });

    it("fails explicitly when the popup is blocked", async () => {
        vi.stubGlobal("window", { open: () => null });

        const error = await createOAuthAuthorization({ BASE_URL: "/" })
            .authorizeInPopup({
                getAuthorizationUrl: () => "https://git.example.com/authorize"
            })
            .catch(error => error);

        expect(error).toBeInstanceOf(OAuthAuthorizationError);
        expect(error.reason).toBe("popup blocked");
    });
});
