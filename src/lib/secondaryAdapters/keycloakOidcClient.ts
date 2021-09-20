import type { OidcClient } from "../ports/OidcClient";
import keycloak_js from "keycloak-js";
import type { KeycloakConfig } from "keycloak-js";
import { id } from "tsafe/id";
import { assert } from "tsafe/assert";
import { createKeycloakAdapter } from "keycloakify";
import { injectGlobalStatesInSearchParams } from "powerhooks/useGlobalState";
import { Evt } from "evt";
import type { UnpackEvt } from "evt";

export async function createKeycloakOidcClient(params: {
    keycloakConfig: KeycloakConfig;
}): Promise<OidcClient> {
    const { keycloakConfig } = params;

    const keycloakInstance = keycloak_js(keycloakConfig);

    const { origin } = window.location;

    const isAuthenticated = await keycloakInstance
        .init({
            "onLoad": "check-sso",
            "silentCheckSsoRedirectUri": `${origin}/silent-sso.html`,
            "responseMode": "query",
            "checkLoginIframe": false,
            "adapter": createKeycloakAdapter({
                "transformUrlBeforeRedirect": injectGlobalStatesInSearchParams,
                keycloakInstance,
            }),
        })
        .catch((error: Error) => error);

    //TODO: Make sure that result is always an object.
    if (isAuthenticated instanceof Error) {
        throw isAuthenticated;
    }

    const login: OidcClient.NotLoggedIn["login"] = async () => {
        await keycloakInstance.login({ "redirectUri": window.location.href });

        return new Promise<never>(() => {});
    };

    if (!isAuthenticated) {
        return id<OidcClient.NotLoggedIn>({
            "isUserLoggedIn": false,
            login,
        });
    }

    const evtOidcTokens = Evt.create<
        UnpackEvt<OidcClient.LoggedIn["evtOidcTokens"]> | undefined
    >({
        "idToken": keycloakInstance.idToken!,
        "refreshToken": keycloakInstance.refreshToken!,
        "accessToken": keycloakInstance.token!,
    } as const);

    return id<OidcClient.LoggedIn>({
        "isUserLoggedIn": true,
        evtOidcTokens,
        "renewOidcTokensIfExpiresSoonOrRedirectToLoginIfAlreadyExpired": async params => {
            const { minValidityMs = 10000 } = params ?? {};

            if (evtOidcTokens.state === undefined) {
                return;
            }

            if (!keycloakInstance.isTokenExpired(Math.floor(minValidityMs / 1000))) {
                return;
            }

            evtOidcTokens.state = undefined;

            const error = await keycloakInstance.updateToken(-1).then(
                isRefreshed => {
                    console.log({ isRefreshed });
                    return undefined;
                },
                (error: Error) => error,
            );

            if (error) {
                //NOTE: Never resolves
                await login();
            }

            assert(keycloakInstance.token !== undefined);

            evtOidcTokens.state = {
                "idToken": keycloakInstance.idToken!,
                "refreshToken": keycloakInstance.refreshToken!,
                "accessToken": keycloakInstance.token!,
            };
        },
        "logout": async ({ redirectToOrigin }) => {
            await keycloakInstance.logout({
                "redirectUri": redirectToOrigin ? origin : window.location.href,
            });

            return new Promise<never>(() => {});
        },
        "getOidcTokensRemandingValidityMs": () =>
            (function callee(low: number, up: number): number {
                const middle = Math.floor(low + (up - low) / 2);

                if (up - low <= 3000) {
                    return middle;
                }

                return callee(
                    ...(keycloakInstance.isTokenExpired(Math.floor(middle / 1000))
                        ? ([low, middle] as const)
                        : ([middle, up] as const)),
                );
            })(0, 360 * 12 * 30 * 24 * 60 * 60 * 1000 /*One year*/),
    });
}
