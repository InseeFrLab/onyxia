import { Oidc } from "core/ports/Oidc";
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
        publicUrl: import.meta.env.BASE_URL
    });

    return oidc;
}
