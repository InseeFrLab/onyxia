import { describe, it, expect, afterEach, vi } from "vitest";
import { createHash } from "node:crypto";
import { createOAuthAuthorization } from "./oauthAuthorization";
import { OAuthAuthorizationError } from "core/ports/OAuthAuthorization";

const redirectUri = "https://onyxia.example.com/git/oauth/callback";

function mockPopup(params: { callbackSearch: (state: string) => string }) {
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

                        // Simulates the provider redirecting to the Onyxia callback page.
                        setTimeout(() => {
                            const channel = new BroadcastChannel(
                                "onyxia:git-oauth-callback"
                            );
                            channel.postMessage({
                                url: `${redirectUri}?${params.callbackSearch(state)}`
                            });
                            channel.close();
                        }, 10);
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
        mockPopup({ callbackSearch: state => `error=access_denied&state=${state}` });

        await expect(
            createOAuthAuthorization({ redirectUri }).authorizeInPopup({
                getAuthorizationUrl: ({ state }) =>
                    `https://git.example.com/authorize?state=${state}`
            })
        ).rejects.toMatchObject({ reason: "denied" });
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
