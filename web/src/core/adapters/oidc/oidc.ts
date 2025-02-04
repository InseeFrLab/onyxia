import type { Oidc } from "core/ports/Oidc";
import { createOidc as createOidcSpa } from "oidc-spa";

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

    return oidc;
}
