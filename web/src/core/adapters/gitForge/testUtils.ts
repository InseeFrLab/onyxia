import { vi } from "vitest";
import type { GitForgesConfig } from "core/ports/OnyxiaApi/GitForgesConfig";

export type FetchCall = { url: string; init: RequestInit | undefined };

export function mockFetch(handler: (call: FetchCall) => Response) {
    const calls: FetchCall[] = [];

    vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
        const call = { url, init };
        calls.push(call);
        return handler(call);
    });

    return { calls };
}

export const tokenResponse = (suffix: string) =>
    new Response(
        JSON.stringify({
            access_token: `access-${suffix}`,
            refresh_token: `refresh-${suffix}`,
            token_type: "bearer",
            expires_in: 3600
        })
    );

export function createForgeConfig(params: {
    type: GitForgesConfig.ForgeType;
    url: string;
    authentication: GitForgesConfig.Forge["authentication"];
}): GitForgesConfig.Forge {
    const { type, url, authentication } = params;

    return {
        id: new URL(url).host,
        type,
        url,
        displayName: new URL(url).host,
        logoUrl: undefined,
        authentication
    };
}

export const redirectUri = "https://onyxia.example.com/git/oauth/callback";
