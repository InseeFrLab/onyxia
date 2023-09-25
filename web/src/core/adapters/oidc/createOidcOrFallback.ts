import type { Oidc } from "../../ports/Oidc";
import { assert } from "tsafe/assert";

export async function createOidcOrFallback(params: {
    keycloakParams:
        | {
              url?: string;
              realm?: string;
              clientId: string;
          }
        | undefined;
    fallback:
        | {
              keycloakParams: {
                  url: string;
                  clientId: string;
                  realm: string;
              };
              oidc: Oidc.LoggedIn;
          }
        | undefined;
}): Promise<Oidc.LoggedIn> {
    const { keycloakParams, fallback } = params;

    const wrap = (() => {
        const { url, realm, clientId } = {
            ...fallback?.keycloakParams,
            ...keycloakParams
        };

        assert(
            url !== undefined && clientId !== undefined && realm !== undefined,
            "There is no specific keycloak config in the region for s3 and no keycloak config to fallback to"
        );

        if (
            fallback !== undefined &&
            url === fallback.keycloakParams.url &&
            realm === fallback.keycloakParams.realm &&
            clientId === fallback.keycloakParams.clientId
        ) {
            return {
                "type": "oidc client",
                "oidc": fallback.oidc
            } as const;
        }

        return {
            "type": "keycloak params",
            "keycloakParams": { url, realm, clientId }
        } as const;
    })();

    switch (wrap.type) {
        case "oidc client":
            return wrap.oidc;
        case "keycloak params": {
            const { createOidc } = await import("./oidc");

            const oidc = await createOidc({
                ...wrap.keycloakParams,
                "transformUrlBeforeRedirect": url => url,
                "getUiLocales": () => "en"
            });

            if (!oidc.isUserLoggedIn) {
                await oidc.login({ "doesCurrentHrefRequiresAuth": true });
                assert(false);
            }

            return oidc;
        }
    }
}
