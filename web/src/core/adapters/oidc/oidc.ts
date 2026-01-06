import type { Oidc } from "core/ports/Oidc";
import { createOidc as createOidcSpa } from "oidc-spa/core";
import { isKeycloak } from "oidc-spa/keycloak";
import type { OidcParams, OidcParams_Partial } from "core/ports/OnyxiaApi";
import { objectKeys } from "tsafe/objectKeys";
import {
    addOrUpdateSearchParam,
    getSearchParam,
    getAllSearchParams
} from "powerhooks/tools/urlSearchParams";
import type { Language } from "core/ports/OnyxiaApi/Language";

export async function createOidc<AutoLogin extends boolean>(
    params: OidcParams & {
        transformBeforeRedirectForKeycloakTheme: (params: {
            authorizationUrl: string;
        }) => string;
        getCurrentLang: () => Language;
        autoLogin: AutoLogin;
        enableDebugLogs: boolean;
    }
): Promise<AutoLogin extends true ? Oidc.LoggedIn : Oidc> {
    const {
        issuerUri,
        clientId,
        scope_spaceSeparated,
        transformBeforeRedirectForKeycloakTheme,
        getCurrentLang,
        extraQueryParams_raw,
        idleSessionLifetimeInSeconds,
        autoLogin,
        enableDebugLogs
    } = params;

    const oidc = await createOidcSpa({
        issuerUri,
        clientId,
        scopes: scope_spaceSeparated?.split(" "),
        transformUrlBeforeRedirect: ({ authorizationUrl, isSilent }) => {
            add_extraQueryParams_raw: {
                if (extraQueryParams_raw === undefined) {
                    break add_extraQueryParams_raw;
                }

                const extraQueryParams_raw_normalized = extraQueryParams_raw
                    .replace(/^\?/, "")
                    .replace(/^&/, "")
                    .replace(/&$/, "");

                if (extraQueryParams_raw_normalized === "") {
                    break add_extraQueryParams_raw;
                }

                for (const name of Object.keys(
                    getAllSearchParams(
                        `https://dummy.com?${extraQueryParams_raw_normalized}`
                    )
                )) {
                    const { wasPresent, url_withoutTheParam } = getSearchParam({
                        url: authorizationUrl,
                        name
                    });
                    if (wasPresent) {
                        authorizationUrl = url_withoutTheParam;
                    }
                }

                authorizationUrl = `${authorizationUrl}&${extraQueryParams_raw_normalized}`;
            }

            if (!isSilent) {
                authorizationUrl = addOrUpdateSearchParam({
                    url: authorizationUrl,
                    name: "ui_locales",
                    value: getCurrentLang(),
                    encodeMethod: "www-form"
                });

                if (isKeycloak({ issuerUri })) {
                    authorizationUrl = transformBeforeRedirectForKeycloakTheme({
                        authorizationUrl
                    });
                }
            }

            return authorizationUrl;
        },
        idleSessionLifetimeInSeconds,
        debugLogs: enableDebugLogs,
        autoLogin
    });

    return oidc;
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
