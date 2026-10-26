import { z } from "zod";
import { GitProviderUnauthorizedError, type GitProvider } from "core/ports/GitProvider";

const zTokenResponse = z.object({
    access_token: z.string().min(1),
    token_type: z.string().refine(value => value.toLowerCase() === "bearer"),
    refresh_token: z.string().min(1).optional(),
    expires_in: z.number().positive()
});

/**
 * POST to the OAuth token endpoint of a public client (no secret).
 * Throws GitProviderUnauthorizedError when the grant (code or refresh token) is rejected.
 */
export async function requestOAuthTokens(params: {
    tokenUrl: string;
    body: Record<string, string>;
}): Promise<GitProvider.Tokens> {
    const { tokenUrl, body } = params;

    const requestTime = Date.now();

    const response = await fetch(tokenUrl, {
        method: "POST",
        headers: { Accept: "application/json" },
        credentials: "omit",
        cache: "no-store",
        referrerPolicy: "no-referrer",
        body: new URLSearchParams(body)
    });

    // NOTE: RFC 6749 §5.2, invalid_grant is a 400.
    if (response.status === 400 || response.status === 401) {
        throw new GitProviderUnauthorizedError(
            `The OAuth grant was rejected (${response.status})`
        );
    }

    if (!response.ok) {
        throw new Error(`OAuth token request failed with status ${response.status}`);
    }

    const tokenResponse = parseOrThrow(
        zTokenResponse,
        await response.json(),
        "OAuth token"
    );

    return {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        expirationTime: requestTime + tokenResponse.expires_in * 1000
    };
}

export function buildAuthorizationUrl(params: {
    authorizationUrl: string;
    clientId: string;
    scopes: string[];
    redirectUri: string;
    state: string;
    codeChallenge: string;
}): string {
    const { authorizationUrl, clientId, scopes, redirectUri, state, codeChallenge } =
        params;

    const url = new URL(authorizationUrl);

    url.search = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: scopes.join(" "),
        state,
        code_challenge: codeChallenge,
        code_challenge_method: "S256"
    }).toString();

    return url.href;
}

/** The authorization of the services' OAuth application, refreshed by the service */
export function createServiceAuthorization(params: {
    authorizationUrl: string;
    tokenUrl: string;
    clientId: string;
    scopes: string[];
}): GitProvider.ServiceAuthorization {
    const { authorizationUrl, tokenUrl, clientId, scopes } = params;

    return {
        getAuthorizationUrl: ({ redirectUri, state, codeChallenge }) =>
            buildAuthorizationUrl({
                authorizationUrl,
                clientId,
                scopes,
                redirectUri,
                state,
                codeChallenge
            }),
        exchangeAuthorizationCode: async ({ code, codeVerifier, redirectUri }) => {
            const { accessToken, refreshToken, expirationTime } =
                await requestOAuthTokens({
                    tokenUrl,
                    body: {
                        grant_type: "authorization_code",
                        client_id: clientId,
                        redirect_uri: redirectUri,
                        code,
                        code_verifier: codeVerifier
                    }
                });

            if (refreshToken === undefined) {
                throw new Error(
                    "The Git provider didn't issue a refresh token for the service"
                );
            }

            return { accessToken, refreshToken, expirationTime };
        }
    };
}

/** OAuth for Onyxia's own application, the tokens never leave the browser */
export function createUiOAuth(params: {
    authorizationUrl: string;
    tokenUrl: string;
    clientId: string;
    scopes: string[];
    revokeTokens: GitProvider.OAuth["revokeTokens"];
    authorizedApplicationsUrl: string;
}): GitProvider.OAuth {
    const {
        authorizationUrl,
        tokenUrl,
        clientId,
        scopes,
        revokeTokens,
        authorizedApplicationsUrl
    } = params;

    return {
        getAuthorizationUrl: ({ redirectUri, state, codeChallenge }) =>
            buildAuthorizationUrl({
                authorizationUrl,
                clientId,
                scopes,
                redirectUri,
                state,
                codeChallenge
            }),
        exchangeAuthorizationCode: ({ code, codeVerifier, redirectUri }) =>
            requestOAuthTokens({
                tokenUrl,
                body: {
                    grant_type: "authorization_code",
                    client_id: clientId,
                    redirect_uri: redirectUri,
                    code,
                    code_verifier: codeVerifier
                }
            }),
        refreshTokens: ({ refreshToken, redirectUri }) =>
            requestOAuthTokens({
                tokenUrl,
                body: {
                    grant_type: "refresh_token",
                    client_id: clientId,
                    refresh_token: refreshToken,
                    redirect_uri: redirectUri
                }
            }),
        revokeTokens,
        authorizedApplicationsUrl
    };
}

/** Authenticated call to a provider REST API */
export async function fetchProviderApi(params: {
    url: string;
    method?: "GET" | "POST" | "DELETE";
    accessToken: string;
    jsonBody?: unknown;
    signal?: AbortSignal;
}): Promise<Response> {
    const { url, method = "GET", accessToken, jsonBody, signal } = params;

    const response = await fetch(url, {
        method,
        headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
            ...(jsonBody === undefined ? {} : { "Content-Type": "application/json" })
        },
        body: jsonBody === undefined ? undefined : JSON.stringify(jsonBody),
        credentials: "omit",
        cache: "no-store",
        referrerPolicy: "no-referrer",
        signal
    });

    if (response.status === 401) {
        throw new GitProviderUnauthorizedError();
    }

    return response;
}

export function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown, what: string): T {
    try {
        return schema.parse(value);
    } catch (error) {
        throw new Error(`Unexpected ${what} response shape: ${String(error)}`);
    }
}

/** NOTE: Never let a provider point us to another host */
export function getIsSameOrigin(url: string, baseUrl: string): boolean {
    try {
        return new URL(url).origin === new URL(baseUrl).origin;
    } catch {
        return false;
    }
}
