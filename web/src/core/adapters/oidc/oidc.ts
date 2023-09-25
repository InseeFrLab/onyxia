import type { Oidc } from "../../ports/Oidc";
import keycloak_js from "keycloak-js";
import { id } from "tsafe/id";
import { createKeycloakAdapter } from "keycloakify";
import { decodeJwt } from "core/tools/jwt";
import type { Param0, ReturnType } from "tsafe";
import { addParamToUrl } from "powerhooks/tools/urlSearchParams";
import { assert } from "tsafe/assert";
import { Evt } from "evt";

export async function createOidc(params: {
    url: string;
    realm: string;
    clientId: string;
    transformUrlBeforeRedirect: (url: string) => string;
    getUiLocales: () => string;
    log?: typeof console.log;
}): Promise<Oidc> {
    const { url, realm, clientId, transformUrlBeforeRedirect, getUiLocales, log } =
        params;

    const keycloakInstance = keycloak_js({ url, realm, clientId });

    let redirectMethod: ReturnType<
        Param0<typeof createKeycloakAdapter>["getRedirectMethod"]
    > = "overwrite location.href";

    const isAuthenticated = await keycloakInstance
        .init({
            "onLoad": "check-sso",
            "silentCheckSsoRedirectUri": `${window.location.origin}/silent-sso.html`,
            "responseMode": "query",
            "checkLoginIframe": false,
            "adapter": createKeycloakAdapter({
                "transformUrlBeforeRedirect": url =>
                    // prettier-ignore
                    [url]
                        .map(transformUrlBeforeRedirect)
                        .map(
                            url =>
                                addParamToUrl({
                                    url,
                                    "name": "ui_locales",
                                    "value": getUiLocales()
                                }).newUrl
                        )
                    [0],
                keycloakInstance,
                "getRedirectMethod": () => redirectMethod
            })
        })
        .catch((error: Error) => error);

    //TODO: Make sure that result is always an object.
    if (isAuthenticated instanceof Error) {
        throw isAuthenticated;
    }

    const login: Oidc.NotLoggedIn["login"] = async ({ doesCurrentHrefRequiresAuth }) => {
        if (doesCurrentHrefRequiresAuth) {
            redirectMethod = "location.replace";
        }

        await keycloakInstance.login({ "redirectUri": window.location.href });

        return new Promise<never>(() => {});
    };

    if (!isAuthenticated) {
        return id<Oidc.NotLoggedIn>({
            "isUserLoggedIn": false,
            login
        });
    }

    assert(keycloakInstance.token !== undefined);

    let currentAccessToken = keycloakInstance.token;

    const oidc = id<Oidc.LoggedIn>({
        "isUserLoggedIn": true,
        "getAccessToken": () => ({
            "accessToken": currentAccessToken,
            "expirationTime": getAccessTokenExpirationTime(currentAccessToken)
        }),
        "logout": async ({ redirectTo }) => {
            await keycloakInstance.logout({
                "redirectUri": (() => {
                    switch (redirectTo) {
                        case "current page":
                            return window.location.href;
                        case "home":
                            return window.location.origin;
                    }
                })()
            });

            return new Promise<never>(() => {});
        },
        "renewToken": async () => {
            await keycloakInstance.updateToken(-1);

            assert(keycloakInstance.token !== undefined);

            currentAccessToken = keycloakInstance.token;
        }
    });

    (function callee() {
        const msBeforeExpiration =
            getAccessTokenExpirationTime(currentAccessToken) - Date.now();

        setTimeout(async () => {
            log?.(
                `OIDC access token will expire in ${minValiditySecond} seconds, waiting for user activity before renewing`
            );

            await Evt.merge([
                Evt.from(document, "mousemove"),
                Evt.from(document, "keydown")
            ]).waitFor();

            log?.("User activity detected. Refreshing access token now");

            const error = await keycloakInstance.updateToken(-1).then(
                () => undefined,
                (error: Error) => error
            );

            if (error) {
                log?.("Can't refresh OIDC access token, getting a new one");
                //NOTE: Never resolves
                await login({ "doesCurrentHrefRequiresAuth": true });
            }

            assert(keycloakInstance.token !== undefined);

            currentAccessToken = keycloakInstance.token;

            callee();
        }, msBeforeExpiration - minValiditySecond * 1000);
    })();

    return oidc;
}

const minValiditySecond = 25;

function getAccessTokenExpirationTime(accessToken: string): number {
    return decodeJwt<{ exp: number }>(accessToken)["exp"] * 1000;
}
