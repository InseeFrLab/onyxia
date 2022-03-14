import type { OidcClient } from "../ports/OidcClient";
import keycloak_js from "keycloak-js";
import { id } from "tsafe/id";
import { assert } from "tsafe/assert";
import { createKeycloakAdapter } from "keycloakify";

export async function createKeycloakOidcClient(params: {
    url: string;
    realm: string;
    clientId: string;
    transformUrlBeforeRedirectToLogin: ((url: string) => string) | undefined;
}): Promise<OidcClient> {
    const { url, realm, clientId, transformUrlBeforeRedirectToLogin } = params;

    const keycloakInstance = keycloak_js({ url, realm, clientId });

    const isAuthenticated = await keycloakInstance
        .init({
            "onLoad": "check-sso",
            "silentCheckSsoRedirectUri": `${window.location.origin}/silent-sso.html`,
            "responseMode": "query",
            "checkLoginIframe": false,
            "adapter": createKeycloakAdapter({
                "transformUrlBeforeRedirect": url =>
                    transformUrlBeforeRedirectToLogin?.(url) ?? url,
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

    return id<OidcClient.LoggedIn>({
        "isUserLoggedIn": true,
        "getAccessToken": async () => {
            if (!keycloakInstance.isTokenExpired(10)) {
                return keycloakInstance.token!;
            }

            const error = await keycloakInstance.updateToken(-1).then(
                () => undefined,
                (error: Error) => error,
            );

            if (error) {
                //NOTE: Never resolves
                await login();
            }

            assert(keycloakInstance.token !== undefined);

            return keycloakInstance.token;
        },
        "logout": async ({ redirectTo }) => {
            await keycloakInstance.logout({
                "redirectUri": (() => {
                    switch (redirectTo) {
                        case "current page":
                            return window.location.href;
                        case "home":
                            return window.location.origin;
                    }
                })(),
            });

            return new Promise<never>(() => {});
        },
    });
}
