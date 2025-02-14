import type { Oidc } from "core/ports/Oidc";
import { assert } from "tsafe/assert";
import { noUndefined } from "tsafe/noUndefined";

export async function createOidcOrFallback(params: {
    oidcParams:
        | {
              issuerUri?: string;
              clientId: string;
          }
        | undefined;
    fallbackOidc: Oidc.LoggedIn;
}): Promise<Oidc.LoggedIn> {
    const { oidcParams, fallbackOidc } = params;

    const wrap = (() => {
        const { issuerUri, clientId } = {
            ...fallbackOidc?.params,
            ...noUndefined(oidcParams ?? {})
        };

        assert(
            issuerUri !== undefined && clientId !== undefined,
            "There is no specific oidc config in the region for satellite service and no oidc config to fallback to"
        );

        if (
            fallbackOidc !== undefined &&
            issuerUri === fallbackOidc.params.issuerUri &&
            clientId === fallbackOidc.params.clientId
        ) {
            return {
                type: "oidc client",
                oidc: fallbackOidc
            } as const;
        }

        return {
            type: "oidc params",
            oidcParams: { issuerUri, clientId }
        } as const;
    })();

    switch (wrap.type) {
        case "oidc client":
            return wrap.oidc;
        case "oidc params": {
            const { createOidc } = await import("../oidc");

            const oidc = await createOidc({
                issuerUri: wrap.oidcParams.issuerUri,
                clientId: wrap.oidcParams.clientId,
                transformUrlBeforeRedirect: url => url
            });

            if (!oidc.isUserLoggedIn) {
                await oidc.login({ doesCurrentHrefRequiresAuth: true });
                assert(false);
            }

            if (fallbackOidc.isAccessTokenSubstitutedWithIdToken) {
                oidc.isAccessTokenSubstitutedWithIdToken = true;
            }

            return oidc;
        }
    }
}
