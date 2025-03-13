import type { Oidc } from "core/ports/Oidc";
import { createOidc as createOidcSpa } from "oidc-spa";
import { parseKeycloakIssuerUri } from "oidc-spa/tools/parseKeycloakIssuerUri";
import type { OidcParams, OidcParams_Partial } from "core/ports/OnyxiaApi";
import { objectKeys } from "tsafe/objectKeys";
import { addParamToUrl } from "powerhooks/tools/urlSearchParams";

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
                authorizationUrl = addParamToUrl({
                    url: authorizationUrl,
                    name: "audience",
                    value: audience
                }).newUrl;
            }

            if (extraQueryParams_raw !== undefined) {
                const extraUrlSearchParams = new URLSearchParams(extraQueryParams_raw);

                for (const [key, value] of extraUrlSearchParams) {
                    authorizationUrl = addParamToUrl({
                        url: authorizationUrl,
                        name: key,
                        value
                    }).newUrl;
                }
            }

            return authorizationUrl;
        },
        idleSessionLifetimeInSeconds,
        homeUrl: import.meta.env.BASE_URL
    });

    // TODO: On next oidc-spa major, just return oidc directly
    // getTokens will be async.
    // Do not forget to directly assign autoLogin to the create function.

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
