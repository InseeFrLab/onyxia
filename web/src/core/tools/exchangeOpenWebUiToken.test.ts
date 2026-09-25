import { afterEach, expect, it, vi } from "vitest";
import { exchangeOpenWebUiToken } from "./exchangeOpenWebUiToken";
afterEach(() => vi.unstubAllGlobals());
it("exchanges the OIDC token using the configured API base", async () => {
    const fetchMock = vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify({ token: "exchanged" })));
    vi.stubGlobal("fetch", fetchMock);
    expect(
        await exchangeOpenWebUiToken({
            apiBase: "https://example.com/api/",
            oidcAccessToken: "oidc"
        })
    ).toBe("exchanged");
    expect(fetchMock).toHaveBeenCalledWith(
        "https://example.com/api/v1/auths/oauth/oidc/token/exchange",
        expect.objectContaining({
            method: "POST",
            body: JSON.stringify({ token: "oidc" })
        })
    );
});
it("rejects malformed tokens", async () => {
    vi.stubGlobal(
        "fetch",
        vi
            .fn()
            .mockResolvedValue(
                new Response(JSON.stringify({ access_token: "unexpected" }))
            )
    );
    await expect(
        exchangeOpenWebUiToken({
            apiBase: "https://example.com/api",
            oidcAccessToken: "oidc"
        })
    ).rejects.toThrow();
});
