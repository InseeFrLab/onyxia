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
import { assert } from "tsafe";

let enableDebugLogs_root: boolean | undefined = undefined;
let sessionRestorationMethod_root: "auto" | "iframe" | "foreground redirect" | undefined =
    undefined;

export const warnUserSecondsBeforeAutoLogout = 60;

export async function createOidc(
    params: OidcParams & {
        transformBeforeRedirectForKeycloakTheme: (params: {
            authorizationUrl: string;
        }) => string;
        getCurrentLang: () => Language;
        enableDebugLogs: boolean;
        disableDPoP: boolean;
        sessionRestorationMethod: "auto" | "iframe" | "foreground redirect";
    }
): Promise<Oidc> {
    const {
        issuerUri,
        clientId,
        scope_spaceSeparated,
        transformBeforeRedirectForKeycloakTheme,
        getCurrentLang,
        extraQueryParams_raw,
        idleSessionLifetimeInSeconds,
        enableDebugLogs,
        disableDPoP,
        sessionRestorationMethod
    } = params;

    if (enableDebugLogs_root === undefined) {
        enableDebugLogs_root = enableDebugLogs;
    }

    if (sessionRestorationMethod_root === undefined) {
        sessionRestorationMethod_root = sessionRestorationMethod;
    }

    const extraQueryParams_raw_normalized = extraQueryParams_raw
        ?.replace(/^\?/, "")
        .replace(/^&/, "")
        .replace(/&$/, "");

    const oidc = await createOidcSpa({
        issuerUri,
        clientId,
        scopes: scope_spaceSeparated?.split(" "),
        transformAuthorizationUrl: ({ authorizationUrl, isNonInteractive }) => {
            add_extraQueryParams_raw: {
                if (!extraQueryParams_raw_normalized) {
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

            if (!isNonInteractive) {
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
        disableDPoP: disableDPoP || undefined,
        sessionRestorationMethod,
        warnUserSecondsBeforeAutoLogout
    });

    return oidc;
}

export async function getChildOidcClient(params: {
    oidcParams_root: OidcParams;
    oidcParams_override: OidcParams_Partial;
    disableDPoP: boolean;
}): Promise<Oidc.LoggedIn> {
    const { oidcParams_root, oidcParams_override, disableDPoP } = params;

    const oidcParams_merged = (() => {
        const oidcParams_merged = { ...oidcParams_root };

        for (const key of objectKeys(oidcParams_override)) {
            const value = oidcParams_override[key];
            if (value === undefined) {
                continue;
            }
            // @ts-expect-error
            oidcParams_merged[key] = value;
        }

        return oidcParams_merged;
    })();

    assert(enableDebugLogs_root !== undefined);
    assert(sessionRestorationMethod_root !== undefined);

    const oidc_child = await createOidc({
        ...oidcParams_merged,
        transformBeforeRedirectForKeycloakTheme: ({ authorizationUrl }) =>
            authorizationUrl,
        getCurrentLang: () => "en",
        enableDebugLogs: enableDebugLogs_root,
        disableDPoP,
        sessionRestorationMethod: sessionRestorationMethod_root
    });

    if (!oidc_child.isUserLoggedIn) {
        throw_error: {
            if (oidc_child.initializationError === undefined) {
                break throw_error;
            }

            if (
                oidc_child.initializationError.authResponse !== undefined &&
                oidc_child.initializationError.authResponse.error ===
                    "unmet_authentication_requirements"
            ) {
                break throw_error;
            }

            console.error(oidc_child.initializationError);

            location.href = oidc_child.validRedirectUri;

            await new Promise<never>(() => {});
        }

        await oidc_child.login({
            doesCurrentHrefEnforceLogin: true
        });
        assert(false);
    }

    return oidc_child;
}
