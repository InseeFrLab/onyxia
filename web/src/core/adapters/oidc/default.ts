import { Oidc } from "core/ports/Oidc";
import { createOidc as createOidcSpa } from "oidc-spa";

export async function createOidc(params: {
    issuerUri: string;
    clientId: string;
    transformUrlBeforeRedirect: (url: string) => string;
    extraQueryParams?: Record<string, string>;
}): Promise<Oidc> {
    const { issuerUri, clientId, transformUrlBeforeRedirect, extraQueryParams } = params;

    return createOidcSpa({
        issuerUri,
        clientId,
        transformUrlBeforeRedirect,
        extraQueryParams
    });
}
