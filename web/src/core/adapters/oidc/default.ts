import { UserManager, type User } from "oidc-client-ts";
import { id } from "tsafe/id";
import type { Oidc } from "core/ports/Oidc";
import { readExpirationTimeInJwt } from "core/tools/readExpirationTimeInJwt";
import { assert } from "tsafe/assert";
import { addParamToUrl, retrieveParamFromUrl } from "powerhooks/tools/urlSearchParams";
import { fnv1aHashToHex } from "core/tools/fnv1aHashToHex";
import { Deferred } from "evt/tools/Deferred";

const paramsToRetrieveFromSuccessfulLogin = ["code", "state", "session_state"] as const;

type OidcTokens = Oidc.Tokens & {
    accessTokenExpirationTime: number;
};

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

    const currentTokens = await (async function getUser() {
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

            window.history.pushState(null, "", url);

            let user: User | undefined = undefined;

            try {
                user = await userManager.signinRedirectCallback(loginSuccessUrl);
            } catch {
                //NOTE: The user has likely pressed the back button just after logging in.
                return undefined;
            }

            return user;
        }

        restore_from_session: {
            const user = await userManager.getUser();

            if (user === null) {
                break restore_from_session;
            }

            return user;
        }

        restore_from_http_only_cookie: {
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
                break restore_from_http_only_cookie;
            }

            const user = await userManager.signinRedirectCallback(loginSuccessUrl);

            return user;
        }

        return undefined;
    })().then(user => {
        if (user === undefined) {
            return undefined;
        }

        const tokens = userToTokens(user);

        if (tokens.refreshTokenExpirationTime < tokens.accessTokenExpirationTime) {
            console.warn(
                [
                    "The OIDC refresh token shorter than the one of the access token.",
                    "This is very unusual and probably a misconfiguration.",
                    `Check your oidc server configuration for ${clientId} ${authority}`
                ].join(" ")
            );
        }

        return tokens;
    });

    const common: Oidc.Common = {
        "params": {
            authority,
            clientId
        }
    };

    if (currentTokens === undefined) {
        return id<Oidc.NotLoggedIn>({
            ...common,
            "isUserLoggedIn": false,
            login
        });
    }

    const oidc = id<Oidc.LoggedIn>({
        ...common,
        "isUserLoggedIn": true,
        "getTokens": () => ({
            "accessToken": currentTokens.accessToken,
            "idToken": currentTokens.idToken,
            "refreshToken": currentTokens.refreshToken,
            "refreshTokenExpirationTime": currentTokens.refreshTokenExpirationTime
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
        "renewTokens": async () => {
            const user = await userManager.signinSilent();

            assert(user !== null);

            Object.assign(currentTokens, userToTokens(user));
        }
    });

    (function scheduleAutomaticRenew() {
        const msBeforeExpiration =
            Math.min(
                currentTokens.accessTokenExpirationTime,
                currentTokens.refreshTokenExpirationTime
            ) - Date.now();

        setTimeout(async () => {
            try {
                await oidc.renewTokens();
            } catch {
                await login({ "doesCurrentHrefRequiresAuth": true });
            }

            scheduleAutomaticRenew();
        }, msBeforeExpiration - /* min validity in seconds */ 25 * 1000);
    })();

    return oidc;
}

function userToTokens(user: User): OidcTokens {
    const accessToken = user.access_token;

    const accessTokenExpirationTime = (() => {
        read_from_metadata: {
            const { expires_in } = user;

            if (expires_in === undefined) {
                break read_from_metadata;
            }

            return Date.now() + expires_in * 1000;
        }

        read_from_jwt: {
            const expirationTime = readExpirationTimeInJwt(accessToken);

            if (expirationTime === undefined) {
                break read_from_jwt;
            }

            return expirationTime;
        }

        assert(false, "Failed to get access token expiration time");
    })();

    const refreshToken = user.refresh_token;

    assert(refreshToken !== undefined, "No refresh token provided by the oidc server");

    const refreshTokenExpirationTime = (() => {
        read_from_jwt: {
            const expirationTime = readExpirationTimeInJwt(refreshToken);

            if (expirationTime === undefined) {
                break read_from_jwt;
            }

            return expirationTime;
        }

        assert(false, "Failed to get refresh token expiration time");
    })();

    const idToken = user.id_token;

    assert(idToken !== undefined, "No id token provided by the oidc server");

    return {
        accessToken,
        accessTokenExpirationTime,
        refreshToken,
        refreshTokenExpirationTime,
        idToken
    };
}
