import { vi } from "vitest";
import type { GitProvidersConfig } from "core/ports/OnyxiaApi/GitProvidersConfig";

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

export function createProviderConfig(params: {
    type: GitProvidersConfig.ProviderType;
    url: string;
    authentication: GitProvidersConfig.Provider["authentication"];
}): GitProvidersConfig.Provider {
    const { type, url, authentication } = params;

    return {
        id: new URL(url).host,
        type,
        url,
        displayName: new URL(url).host,
        logoUrl: undefined,
        documentation: undefined,
        authentication
    };
}

export const redirectUri = "https://onyxia.example.com/git/oauth/callback";
