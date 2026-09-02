import type { AiGateway } from "core/ports/AiGateway";
import { z } from "zod";

const requestTimeoutMs = 10_000;

export function createOpenWebUiGateway(params: {
    id: string;
    name: string;
    description: AiGateway["description"];
    accountCreation: AiGateway["accountCreation"];
    webUiUrl: string;
    getOidcAccessToken: () => Promise<string>;
}): AiGateway {
    const { id, name, description, accountCreation, webUiUrl, getOidcAccessToken } =
        params;

    const apiBase = `${webUiUrl}/api`;

    async function getAccessToken(): Promise<AiGateway.AccessTokenResult> {
        try {
            return await getAccessTokenInner();
        } catch (cause) {
            return {
                ok: false,
                error: {
                    kind: "unexpected",
                    cause: cause instanceof Error ? cause : new Error(String(cause))
                }
            };
        }
    }

    async function getAccessTokenInner(): Promise<AiGateway.AccessTokenResult> {
        const oidcAccessToken = await getOidcAccessToken();

        const response = await fetch(
            `${webUiUrl}/api/v1/auths/oauth/oidc/token/exchange`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: oidcAccessToken }),
                signal: AbortSignal.timeout(requestTimeoutMs)
            }
        );

        if (response.status === 403) {
            return { ok: false, error: { kind: "no-account" } };
        }

        if (!response.ok) {
            return {
                ok: false,
                error: {
                    kind: "unexpected",
                    cause: new Error(
                        `OIDC token exchange failed (${response.status}): ${await response.text()}`
                    )
                }
            };
        }

        const { token: exchangedToken } = z
            .object({
                token: z.string()
            })
            .parse(await response.json());

        return { ok: true, accessToken: exchangedToken };
    }

    return {
        id,
        name,
        protocol: "openai",
        description,
        accountCreation,
        webUiUrl,
        apiBase,
        getAccessToken,
        listModels: async (accessToken: string) => {
            const response = await fetch(`${apiBase}/models`, {
                headers: { Authorization: `Bearer ${accessToken}` },
                signal: AbortSignal.timeout(requestTimeoutMs)
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
