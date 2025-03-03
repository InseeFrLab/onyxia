import type { Oidc } from "core/ports/Oidc";
import { createOidc as createOidcSpa } from "oidc-spa";
import { parseKeycloakIssuerUri } from "oidc-spa/tools/parseKeycloakIssuerUri";
import type { OidcParams, OidcParams_Partial } from "core/ports/OnyxiaApi";
import { objectKeys } from "tsafe/objectKeys";

export async function createOidc<AutoLogin extends boolean>(
    params: OidcParams & {
        transformUrlBeforeRedirect_ui: (params: {
            isKeycloak: boolean;
            authorizationUrl: string;
        }) => string;
        autoLogin: AutoLogin;
    }
): Promise<AutoLogin extends true ? Oidc.LoggedIn : Oidc> {
    const {
        issuerUri,
        clientId,
        scope_spaceSeparated,
        audience,
        transformUrlBeforeRedirect_ui,
        extraQueryParams_raw,
        idleSessionLifetimeInSeconds,
        autoLogin
    } = params;

    const oidc = await createOidcSpa({
        issuerUri,
        clientId,
        scopes: scope_spaceSeparated?.split(" "),
        transformUrlBeforeRedirect_next: ({ authorizationUrl, isSilent }) => {
            if (!isSilent) {
                authorizationUrl = transformUrlBeforeRedirect_ui({
                    isKeycloak:
                        parseKeycloakIssuerUri(oidc.params.issuerUri) !== undefined,
                    authorizationUrl
                });
            }

            if (audience !== undefined) {
                const url_obj = new URL(authorizationUrl);

                url_obj.searchParams.set("audience", audience);

                authorizationUrl = url_obj.href;
            }

            if (extraQueryParams_raw !== undefined) {
                const url_obj = new URL(authorizationUrl);
                const extraUrlSearchParams = new URLSearchParams(extraQueryParams_raw);

                for (const [key, value] of extraUrlSearchParams) {
                    url_obj.searchParams.set(key, value);
                }

                authorizationUrl = url_obj.href;
            }

            return authorizationUrl;
        },
        idleSessionLifetimeInSeconds,
        homeUrl: import.meta.env.BASE_URL
    });

    if (!oidc.isUserLoggedIn) {
        if (autoLogin) {
            await oidc.login({ doesCurrentHrefRequiresAuth: true });
            // NOTE: Never
        }

        //@ts-expect-error: We know what we are doing
        return oidc;
    }

    return {
        ...oidc,
        getTokens: () => oidc.getTokens_next()
    };
}

export function mergeOidcParams(params: {
    oidcParams: OidcParams;
    oidcParams_partial: OidcParams_Partial;
}) {
    const { oidcParams, oidcParams_partial } = params;

    const oidcParams_merged = { ...oidcParams };

    for (const key of objectKeys(oidcParams_partial)) {
        const value = oidcParams_partial[key];
        if (value === undefined) {
            continue;
        }
        // @ts-expect-error
        oidcParams_merged[key] = value;
    }

    return oidcParams_merged;
}
