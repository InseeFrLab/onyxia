import type { OidcClient } from "../ports/OidcClient";
import keycloak_js from "keycloak-js";
import type { KeycloakConfig } from "keycloak-js";
import { id } from "tsafe/id";
import { Evt } from "evt";
import { assert } from "tsafe/assert";
import { createKeycloakAdapter } from "keycloakify";
import { injectGlobalStatesInSearchParams } from "powerhooks/useGlobalState";
import { getLocalStorage } from "../tools/safeLocalStorage";

console.log("c'est go!!");

export async function createKeycloakOidcClient(params: {
    keycloakConfig: KeycloakConfig;
}): Promise<OidcClient> {
    const { keycloakConfig } = params;

    const keycloakInstance = keycloak_js(keycloakConfig);

    const { evtLocallyStoredTokens } = getEvtLocallyStoredTokens();

    console.log(JSON.stringify(evtLocallyStoredTokens.state, null, 2));

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
            /*
            "token": evtLocallyStoredTokens.state?.accessToken,
            "idToken": evtLocallyStoredTokens.state?.idToken,
            "refreshToken": evtLocallyStoredTokens.state?.refreshToken
            */
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
        evtLocallyStoredTokens.state = undefined;

        return id<OidcClient.NotLoggedIn>({
            "isUserLoggedIn": false,
            login,
        });
    }

    console.log(keycloakInstance.tokenParsed);

    evtLocallyStoredTokens.state = {
        "idToken": keycloakInstance.idToken!,
        "refreshToken": keycloakInstance.refreshToken!,
        "accessToken": keycloakInstance.token!,
    };

    return id<OidcClient.LoggedIn>({
        "isUserLoggedIn": true,
        "evtOidcTokens": evtLocallyStoredTokens,
        "renewOidcTokensIfExpiresSoonOrRedirectToLoginIfAlreadyExpired": async params => {
            const { minValidityMs = 10000 } = params ?? {};

            if (evtLocallyStoredTokens.state === undefined) {
                return;
            }

            if (!keycloakInstance.isTokenExpired(Math.floor(minValidityMs / 1000))) {
                return;
            }

            evtLocallyStoredTokens.state = undefined;

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

            evtLocallyStoredTokens.state = {
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

const getEvtLocallyStoredTokens = () => {
    const { localStorage } = getLocalStorage();

    const key = "onyxia/localStorage/user/tokens";

    const evtLocallyStoredTokens = Evt.create(
        (() => {
            const item = localStorage.getItem(key);

            return item === null
                ? undefined
                : (JSON.parse(item) as Readonly<{
                      accessToken: string;
                      idToken: string;
                      refreshToken: string;
                  }>);
        })(),
    );

    evtLocallyStoredTokens.toStateless().attach(tokens => {
        if (tokens === undefined) {
            localStorage.removeItem(key);
        } else {
            localStorage.setItem(key, JSON.stringify(tokens));
        }
    });

    return { evtLocallyStoredTokens };
};
