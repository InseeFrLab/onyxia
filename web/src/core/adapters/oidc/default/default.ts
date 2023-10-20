import { UserManager, type User } from "oidc-client-ts";
import { id } from "tsafe/id";
import type { Oidc } from "core/ports/Oidc";
import { decodeJwt } from "core/tools/jwt";
import { assert } from "tsafe/assert";
import { addParamToUrl, retrieveParamFromUrl } from "powerhooks/tools/urlSearchParams";
import { fnv1aHashToHex } from "core/tools/fnv1aHashToHex";
import { Deferred } from "evt/tools/Deferred";

const paramsToRetrieveFromSuccessfulLogin = ["code", "state", "session_state"] as const;

export async function createOidc(params: {
    authority: string;
    clientId: string;
    transformUrlBeforeRedirect: (url: string) => string;
    getUiLocales: () => string;
}): Promise<Oidc> {
    const { authority, clientId, transformUrlBeforeRedirect, getUiLocales } = params;

    const configHash = fnv1aHashToHex(`${authority} ${clientId}`);
    const configHashKey = "configHash";

    const userManager = new UserManager({
        authority,
        "client_id": clientId,
        "redirect_uri": "" /* provided when calling login */,
        "response_type": "code",
        "scope": "openid profile",
        "automaticSilentRenew": true,
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

        for (const name of paramsToRetrieveFromSuccessfulLogin) {
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

    async function silentSignInGetAccessToken(): Promise<
        { accessToken: string; expirationTime: number } | undefined
    > {
        const dLoginSuccessUrl = new Deferred<string | undefined>();

        const timeout = setTimeout(
            () =>
                dLoginSuccessUrl.reject(
                    new Error(`SSO silent login timeout with clientId: ${clientId}`)
                ),
            5000
        );

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

            for (const name of paramsToRetrieveFromSuccessfulLogin) {
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

        return userToAccessToken(user);
    }

    const currentAccessToken:
        | { accessToken: string; expirationTime: number }
        | undefined = await (async () => {
        restore_from_session: {
            const user = await userManager.getUser();

            if (user === null) {
                break restore_from_session;
            }

            return userToAccessToken(user);
        }

        restore_from_http_only_cookie: {
            const accessToken = await silentSignInGetAccessToken();

            if (accessToken === undefined) {
                break restore_from_http_only_cookie;
            }

            return accessToken;
        }

        return undefined;
    })();

    if (currentAccessToken === undefined) {
        return id<Oidc.NotLoggedIn>({
            "isUserLoggedIn": false,
            login
        });
    }

    const oidc = id<Oidc.LoggedIn>({
        "isUserLoggedIn": true,
        "getAccessToken": () => ({ ...currentAccessToken }),
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
            const user = await userManager.signinSilent();

            assert(user !== null);

            const { accessToken, expirationTime } = userToAccessToken(user);

            currentAccessToken.accessToken = accessToken;
            currentAccessToken.expirationTime = expirationTime;
        }
    });

    return oidc;
}

function userToAccessToken(user: User): { accessToken: string; expirationTime: number } {
    assert(
        user.expires_in !== undefined,
        "Failed to get access token and expiration time please submit an issue on github"
    );

    const expirationTime = Date.now() + user.expires_in * 1000;

    assert(
        user.refresh_token !== undefined,
        "Failed to get access token and expiration time please submit an issue on github"
    );

    check_refresh_token_lifespan_consistency: {
        let refreshTokenExpirationTime: number;

        try {
            refreshTokenExpirationTime =
                decodeJwt<{ exp: number }>(user.refresh_token).exp * 1000;

            assert(
                typeof refreshTokenExpirationTime === "number" &&
                    !isNaN(refreshTokenExpirationTime)
            );
        } catch {
            break check_refresh_token_lifespan_consistency;
        }

        if (refreshTokenExpirationTime - expirationTime < 2000) {
            console.warn(
                [
                    "The expiration time of the refresh token should be significantly greater ",
                    "than the expiration time of the access token check your oidc server configuration"
                ].join(" ")
            );
        }
    }

    return {
        "accessToken": user.access_token,
        expirationTime
    };
}
