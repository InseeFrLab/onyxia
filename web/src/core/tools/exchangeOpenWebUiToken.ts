import { z } from "zod";

export async function exchangeOpenWebUiToken(params: {
    apiBase: string;
    oidcAccessToken: string;
}): Promise<string> {
    const response = await fetch(
        `${params.apiBase.replace(/\/+$/, "")}/v1/auths/oauth/oidc/token/exchange`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: params.oidcAccessToken }),
            signal: AbortSignal.timeout(10_000)
        }
    );
    if (!response.ok) throw new Error(`OIDC token exchange failed (${response.status})`);
    return z.object({ token: z.string().min(1) }).parse(await response.json()).token;
}
