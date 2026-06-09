import type { Ai, GetTokenResult } from "core/ports/Ai";
import { oidcTokenExchange, OidcTokenExchangeError } from "core/tools/oidcTokenExchange";
import { z } from "zod";

export function createAi(params: {
    webUiUrl: string;
    oauthProvider: string;
    getOidcAccessToken: () => Promise<string>;
}): Ai {
    const { webUiUrl, oauthProvider, getOidcAccessToken } = params;

    const apiBase = `${webUiUrl}/api`;

    return {
        webUiUrl,
        apiBase,
        getToken: async (): Promise<GetTokenResult> => {
            const oidcAccessToken = await getOidcAccessToken();

            return oidcTokenExchange({
                tokenExchangeEndpoint: `${webUiUrl}/api/v1/auths/oauth/${oauthProvider}/token/exchange`,
                oidcAccessToken
            })
                .then(token => ({ status: "success" as const, token }))
                .catch((error: unknown) => {
                    if (error instanceof OidcTokenExchangeError && error.status === 403) {
                        return { status: "no-account" as const };
                    }
                    return { status: "error" as const };
                });
        },
        listModels: async (token: string) => {
            const response = await fetch(`${apiBase}/models`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error(`Failed to list models (${response.status})`);
            }

            const { data } = z
                .object({ data: z.array(z.object({ id: z.string(), name: z.string() })) })
                .parse(await response.json());

            return data.map(({ id, name }) => ({ id, name }));
        }
    };
}
