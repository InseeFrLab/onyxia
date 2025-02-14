import type { Oidc } from "core/ports/Oidc";
import { createOidc as createOidcSpa } from "oidc-spa";
import { assert } from "tsafe/assert";

export async function createOidc(params: {
    issuerUri: string;
    clientId: string;
    transformUrlBeforeRedirect: (url: string) => string;
}): Promise<Oidc> {
    const { issuerUri, clientId, transformUrlBeforeRedirect } = params;

    const oidc = await createOidcSpa({
        issuerUri,
        clientId,
        transformUrlBeforeRedirect,
        homeUrl: import.meta.env.BASE_URL,
        debugLogs: false
    });

    if (!oidc.isUserLoggedIn) {
        return oidc;
    }

    function getTokens_patched() {
        assert(oidc.isUserLoggedIn);

        const tokens_real = oidc.getTokens();

        if (!oidc_patched.isAccessTokenSubstitutedWithIdToken) {
            return tokens_real;
        }

        const tokens: ReturnType<Oidc.LoggedIn["getTokens"]> = {
            ...tokens_real,
            accessToken: tokens_real.idToken
        };

        return tokens;
    }

    const oidc_patched: Oidc.LoggedIn = {
        ...oidc,
        getTokens: getTokens_patched,
        isAccessTokenSubstitutedWithIdToken: false
    };

    return oidc_patched;
}
