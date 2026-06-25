import { z } from "zod";

export class OidcTokenExchangeError extends Error {
    constructor(
        public readonly status: number,
        message: string
    ) {
        super(message);
    }
}

export async function oidcTokenExchange(params: {
    tokenExchangeEndpoint: string;
    oidcAccessToken: string;
}): Promise<string> {
    const { tokenExchangeEndpoint, oidcAccessToken } = params;

    const response = await fetch(tokenExchangeEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: oidcAccessToken })
    });

    if (!response.ok) {
        throw new OidcTokenExchangeError(
            response.status,
            `OIDC token exchange failed (${response.status}): ${await response.text()}`
        );
    }

    const json = await response.json();

    let token: string | undefined;

    try {
        const data = z
            .object({
                token: z.string().optional(),
                access_token: z.string().optional()
            })
            .parse(json);

        token = data.token ?? data.access_token;
    } catch {
        throw new Error("Unexpected token exchange response shape");
    }

    if (token === undefined || token === "") {
        throw new Error("Token exchange response contained no token");
    }

    return token;
}
