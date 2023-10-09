import type { Oidc } from "../../ports/Oidc";
import { assert } from "tsafe/assert";

export async function createOidcOrFallback(params: {
    oidcParams:
        | {
              authority?: string;
              clientId: string;
          }
        | undefined;
    fallback:
        | {
              oidcParams: {
                  authority: string;
                  clientId: string;
              };
              oidc: Oidc.LoggedIn;
          }
        | undefined;
}): Promise<Oidc.LoggedIn> {
    const { oidcParams, fallback } = params;

    const wrap = (() => {
        const { authority, clientId } = {
            ...fallback?.oidcParams,
            ...oidcParams
        };

        assert(
            authority !== undefined && clientId !== undefined,
            "There is no specific oidc config in the region for satellite service and no oidc config to fallback to"
        );

        if (
            fallback !== undefined &&
            authority === fallback.oidcParams.authority &&
            clientId === fallback.oidcParams.clientId
        ) {
            return {
                "type": "oidc client",
                "oidc": fallback.oidc
            } as const;
        }

        return {
            "type": "keycloak params",
            "oidcParams": { authority, clientId }
        } as const;
    })();

    switch (wrap.type) {
        case "oidc client":
            return wrap.oidc;
        case "keycloak params": {
            const { createOidc } = await import("./oidc");

            const oidc = await createOidc({
                "authority": wrap.oidcParams.authority,
                "clientId": wrap.oidcParams.clientId,
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
