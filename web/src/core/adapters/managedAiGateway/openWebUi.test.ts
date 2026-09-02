import { afterEach, describe, expect, it, vi } from "vitest";
import { createOpenWebUiGateway } from "core/adapters/managedAiGateway/openWebUi";
import { ZodError } from "zod";

function createAdapter(params?: { getOidcAccessToken?: () => Promise<string> }) {
    return createOpenWebUiGateway({
        id: "gateway-a",
        name: "Gateway A",
        description: undefined,
        accountCreation: undefined,
        webUiUrl: "https://ai.example.com",
        getOidcAccessToken:
            params?.getOidcAccessToken ?? (() => Promise.resolve("oidc-token"))
    });
}

describe(createOpenWebUiGateway.name, () => {
    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    it("exchanges the OIDC token through the OpenWebUI endpoint", async () => {
        const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
            new Response(JSON.stringify({ token: "openwebui-token" }), {
                status: 200
            })
        );
        vi.stubGlobal("fetch", fetchMock);

        await expect(createAdapter().getAccessToken()).resolves.toStrictEqual({
            ok: true,
            accessToken: "openwebui-token"
        });
        expect(fetchMock).toHaveBeenCalledWith(
            "https://ai.example.com/api/v1/auths/oauth/oidc/token/exchange",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: "oidc-token" }),
                signal: expect.any(AbortSignal)
            }
        );
    });

    it("maps a missing OpenWebUI account to the no-account state", async () => {
        vi.stubGlobal(
            "fetch",
            vi
                .fn<typeof fetch>()
                .mockResolvedValue(new Response("Forbidden", { status: 403 }))
        );

        await expect(createAdapter().getAccessToken()).resolves.toStrictEqual({
            ok: false,
            error: { kind: "no-account" }
        });
    });

    it("contains OIDC access-token failures inside the adapter", async () => {
        const fetchMock = vi.fn<typeof fetch>();
        vi.stubGlobal("fetch", fetchMock);
        const error = new Error("OIDC refresh failed");

        const gateway = createAdapter({
            getOidcAccessToken: () => Promise.reject(error)
        });

        await expect(gateway.getAccessToken()).resolves.toStrictEqual({
            ok: false,
            error: { kind: "unexpected", cause: error }
        });
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("returns token-exchange failures as values", async () => {
        vi.stubGlobal(
            "fetch",
            vi
                .fn<typeof fetch>()
                .mockResolvedValue(new Response("Unavailable", { status: 503 }))
        );

        const result = await createAdapter().getAccessToken();

        expect(result.ok).toBe(false);
        if (result.ok || result.error.kind !== "unexpected") {
            return;
        }
        expect(result.error.cause).toEqual(
            new Error("OIDC token exchange failed (503): Unavailable")
        );
    });

    it("returns an unexpected error when the token-exchange response has no token", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn<typeof fetch>().mockResolvedValue(
                new Response(JSON.stringify({ access_token: "openwebui-token" }), {
                    status: 200
                })
            )
        );

        const result = await createAdapter().getAccessToken();

        expect(result.ok).toBe(false);
        if (result.ok || result.error.kind !== "unexpected") {
            return;
        }
        expect(result.error.cause).toBeInstanceOf(ZodError);
    });
});
