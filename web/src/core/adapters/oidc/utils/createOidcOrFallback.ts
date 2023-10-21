import type { Oidc } from "core/ports/Oidc";
import { assert, type Equals } from "tsafe/assert";

export async function createOidcOrFallback(params: {
    oidcAdapterImplementationToUseIfNotFallingBack: "default";
    oidcParams:
        | {
              authority?: string;
              clientId: string;
          }
        | undefined;
    fallbackOidc: Oidc.LoggedIn | undefined;
}): Promise<Oidc.LoggedIn> {
    const { oidcAdapterImplementationToUseIfNotFallingBack, oidcParams, fallbackOidc } =
        params;

    const wrap = (() => {
        const { authority, clientId } = {
            ...fallbackOidc?.params,
            ...oidcParams
        };

        assert(
            authority !== undefined && clientId !== undefined,
            "There is no specific oidc config in the region for satellite service and no oidc config to fallback to"
        );

        if (
            fallbackOidc !== undefined &&
            authority === fallbackOidc.params.authority &&
            clientId === fallbackOidc.params.clientId
        ) {
            return {
                "type": "oidc client",
                "oidc": fallbackOidc
            } as const;
        }

        return {
            "type": "oidc params",
            "oidcParams": { authority, clientId }
        } as const;
    })();

    switch (wrap.type) {
        case "oidc client":
            return wrap.oidc;
        case "oidc params": {
            assert<
                Equals<typeof oidcAdapterImplementationToUseIfNotFallingBack, "default">
            >();

            const { createOidc } = await import("../default");

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
