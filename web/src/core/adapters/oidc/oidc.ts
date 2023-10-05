import { UserManager, WebStorageStateStore } from "oidc-client-ts";
import { id } from "tsafe/id";
import type { Oidc } from "../../ports/Oidc";
import { decodeJwt } from "core/tools/jwt";
import { assert } from "tsafe/assert";
import { addParamToUrl, retrieveParamFromUrl } from "powerhooks/tools/urlSearchParams";
import { Evt } from "evt";

export async function createOidc(params: {
    authority: string;
    clientId: string;
    transformUrlBeforeRedirect: (url: string) => string;
    getUiLocales: () => string;
    log?: typeof console.log;
}): Promise<Oidc> {
    const { authority, clientId, transformUrlBeforeRedirect, getUiLocales, log } = params;

    const userManager = new UserManager({
        authority,
        "client_id": clientId,
        "redirect_uri": "" /* provided when calling login */,
        "response_type": "code",
        "scope": "openid profile",
        "userStore": new WebStorageStateStore({ "store": window.localStorage }),
        "automaticSilentRenew": false,
        "silent_redirect_uri": `${window.location.origin}/silent-sso.html`
    });

    const login: Oidc.NotLoggedIn["login"] = async () => {
        //NOTE: We know there is a extraQueryParameter option but it doesn't allow
        // to control the encoding so we have to hack the global URL Class that is
        // used internally by oidc-client-ts

        const URL_real = window.URL;

        function URL(...args: ConstructorParameters<typeof URL_real>) {
            const urlInstance = new URL_real(...args);

            return new Proxy(urlInstance, {
                "get": (target, prop) => {
                    if (prop === "href") {
                        return [urlInstance.href].map(transformUrlBeforeRedirect).map(
                            url =>
                                addParamToUrl({
                                    url,
                                    "name": "ui_locales",
                                    "value": getUiLocales()
                                }).newUrl
                        )[0];
                    }

                    //@ts-expect-error
                    return target[prop];
                }
            });
        }

        Object.defineProperty(window, "URL", { "value": URL });

        await userManager.signinRedirect({
            "redirect_uri": window.location.href,
            "redirectMethod": "replace"
        });
        return new Promise<never>(() => {});
    };

    read_successful_login_query_params: {
        let url = window.location.href;

        const names = ["code", "state", "session_state"];

        for (const name of names) {
            const result = retrieveParamFromUrl({ name, url });

            if (!result.wasPresent) {
                if (names.indexOf(name) === 0) {
                    break read_successful_login_query_params;
                } else {
                    assert(false);
                }
            }

            url = result.newUrl;
        }

        await userManager.signinRedirectCallback();

        window.history.pushState(null, "", url);
    }

    let currentAccessToken = (await userManager.getUser())?.access_token ?? "";

    if (currentAccessToken === "") {
        return id<Oidc.NotLoggedIn>({
            "isUserLoggedIn": false,
            login
        });
    }

    const oidc = id<Oidc.LoggedIn>({
        "isUserLoggedIn": true,
        "getAccessToken": () => ({
            "accessToken": currentAccessToken,
            "expirationTime": getAccessTokenExpirationTime(currentAccessToken)
        }),
        "logout": async ({ redirectTo }) => {
            await userManager.signoutRedirect({
                "post_logout_redirect_uri": (() => {
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
            const user = await userManager.signinSilent({
                "redirect_uri": window.location.href
            });

            assert(user !== null);

            currentAccessToken = user.access_token;
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

            try {
                await oidc.renewToken();
            } catch {
                log?.("Can't refresh OIDC access token, getting a new one");
                //NOTE: Never resolves
                await login({ "doesCurrentHrefRequiresAuth": true });
            }

            callee();
        }, msBeforeExpiration - minValiditySecond * 1000);
    })();

    return oidc;
}

const minValiditySecond = 25;

function getAccessTokenExpirationTime(accessToken: string): number {
    return decodeJwt<{ exp: number }>(accessToken).exp * 1000;
}
