import { UserManager } from "oidc-client-ts";
import { id } from "tsafe/id";
import type { Oidc } from "../../ports/Oidc";
import { decodeJwt } from "core/tools/jwt";
import { assert } from "tsafe/assert";
import { addParamToUrl, retrieveParamFromUrl } from "powerhooks/tools/urlSearchParams";
import { Evt } from "evt";
import { fnv1aHashToHex } from "core/tools/fnv1aHashToHex";
import { Deferred } from "evt/tools/Deferred";

export async function createOidc(params: {
    authority: string;
    clientId: string;
    transformUrlBeforeRedirect: (url: string) => string;
    getUiLocales: () => string;
    log?: typeof console.log;
}): Promise<Oidc> {
    const { authority, clientId, transformUrlBeforeRedirect, getUiLocales, log } = params;

    const configHash = fnv1aHashToHex(`${authority} ${clientId}`);
    const configHashKey = "configHash";

    const userManager = new UserManager({
        authority,
        "client_id": clientId,
        "redirect_uri": "" /* provided when calling login */,
        "response_type": "code",
        "scope": "openid profile",
        "automaticSilentRenew": false,
        "silent_redirect_uri": `${window.location.origin}/silent-sso.html?${configHashKey}=${configHash}`
    });

    const login: Oidc.NotLoggedIn["login"] = async ({ doesCurrentHrefRequiresAuth }) => {
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

        const { newUrl: redirect_uri } = addParamToUrl({
            "url": window.location.href,
            "name": configHashKey,
            "value": configHash
        });

        await userManager.signinRedirect({
            redirect_uri,
            "redirectMethod": doesCurrentHrefRequiresAuth ? "replace" : "assign"
        });
        return new Promise<never>(() => {});
    };

    read_successful_login_query_params: {
        let url = window.location.href;

        {
            const result = retrieveParamFromUrl({ "name": configHashKey, url });

            if (!result.wasPresent || result.value !== configHash) {
                break read_successful_login_query_params;
            }

            url = result.newUrl;
        }

        {
            const result = retrieveParamFromUrl({ "name": "error", url });

            if (result.wasPresent) {
                throw new Error(`OIDC error: ${result.value}`);
            }
        }

        let loginSuccessUrl = "https://dummy.com";

        for (const name of ["code", "state", "session_state"] as const) {
            const result = retrieveParamFromUrl({ name, url });

            assert(result.wasPresent);

            loginSuccessUrl = addParamToUrl({
                "url": loginSuccessUrl,
                "name": name,
                "value": result.value
            }).newUrl;

            url = result.newUrl;
        }

        try {
            await userManager.signinRedirectCallback(loginSuccessUrl);
        } catch {
            //NOTE: The user has likely pressed the back button just after logging in.
        }

        window.history.pushState(null, "", url);
    }

    async function silentSignInGetAccessToken(): Promise<string | undefined> {
        const dLoginSuccessUrl = new Deferred<string | undefined>();

        const timeout = setTimeout(() => {
            throw new Error(`SSO silent login timeout with clientId: ${clientId}`);
        }, 5000);

        const listener = (event: MessageEvent) => {
            if (
                event.origin !== window.location.origin ||
                typeof event.data !== "string"
            ) {
                return;
            }

            const url = event.data;

            {
                let result: ReturnType<typeof retrieveParamFromUrl>;

                try {
                    result = retrieveParamFromUrl({ "name": configHashKey, url });
                } catch {
                    // This could possibly happen if url is not a valid url.
                    return;
                }

                if (!result.wasPresent || result.value !== configHash) {
                    return;
                }
            }

            clearTimeout(timeout);

            window.removeEventListener("message", listener);

            {
                const result = retrieveParamFromUrl({ "name": "error", url });

                if (result.wasPresent) {
                    dLoginSuccessUrl.resolve(undefined);
                    return;
                }
            }

            let loginSuccessUrl = "https://dummy.com";

            for (const name of ["code", "state", "session_state"] as const) {
                const result = retrieveParamFromUrl({ name, url });

                assert(result.wasPresent);

                loginSuccessUrl = addParamToUrl({
                    "url": loginSuccessUrl,
                    "name": name,
                    "value": result.value
                }).newUrl;
            }

            dLoginSuccessUrl.resolve(loginSuccessUrl);
        };

        window.addEventListener("message", listener, false);

        userManager.signinSilent({ "silentRequestTimeoutInSeconds": 1 }).catch(() => {
            /* error expected */
        });

        const loginSuccessUrl = await dLoginSuccessUrl.pr;

        if (loginSuccessUrl === undefined) {
            return undefined;
        }

        const user = await userManager.signinRedirectCallback(loginSuccessUrl);

        assert(user !== undefined);

        return user.access_token;
    }

    let currentAccessToken = (await userManager.getUser())?.access_token ?? "";

    if (currentAccessToken === "") {
        const accessToken = await silentSignInGetAccessToken();

        if (accessToken !== undefined) {
            currentAccessToken = accessToken;
        }
    }

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
            const accessToken = await silentSignInGetAccessToken();

            assert(accessToken !== undefined);

            currentAccessToken = accessToken;
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
