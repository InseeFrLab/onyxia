import type { OidcClient } from "../ports/OidcClient";
import Keycloak_js from "keycloak-js";
import { id } from "tsafe/id";
import { createKeycloakAdapter } from "keycloakify";
import type { NonPostableEvt } from "evt";
import * as jwtSimple from "jwt-simple";
import type { Param0, ReturnType } from "tsafe";
import { assert } from "tsafe/assert";

export async function createKeycloakOidcClient(params: {
    url: string;
    realm: string;
    clientId: string;
    transformUrlBeforeRedirectToLogin: ((url: string) => string) | undefined;
    evtUserActivity: NonPostableEvt<void> | undefined;
    log?: typeof console.log;
}): Promise<OidcClient> {
    const {
        url,
        realm,
        clientId,
        transformUrlBeforeRedirectToLogin,
        evtUserActivity,
        log,
    } = params;

    const keycloakInstance = new Keycloak_js({ url, realm, clientId });

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
                    transformUrlBeforeRedirectToLogin?.(url) ?? url,
                keycloakInstance,
                "getRedirectMethod": () => redirectMethod,
            }),
        })
        .catch((error: Error) => error);

    //TODO: Make sure that result is always an object.
    if (isAuthenticated instanceof Error) {
        throw isAuthenticated;
    }

    const login: OidcClient.NotLoggedIn["login"] = async ({
        doesCurrentHrefRequiresAuth,
    }) => {
        if (doesCurrentHrefRequiresAuth) {
            redirectMethod = "location.replace";
        }

        await keycloakInstance.login({ "redirectUri": window.location.href });

        return new Promise<never>(() => {});
    };

    if (!isAuthenticated) {
        return id<OidcClient.NotLoggedIn>({
            "isUserLoggedIn": false,
            login,
        });
    }

    const oidcClient = id<OidcClient.LoggedIn>({
        "isUserLoggedIn": true,
        "accessToken": keycloakInstance.token!,
        "expirationTime":
            jwtSimple.decode(keycloakInstance.token!, "", true)["exp"] || "",
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

    (function callee() {
        const msBeforeExpiration =
            jwtSimple.decode(oidcClient.accessToken, "", true)["exp"] * 1000 - Date.now();

        setTimeout(async () => {
            log?.(
                `OIDC access token will expire in ${minValiditySecond} seconds, waiting for user activity before renewing`,
            );

            if (evtUserActivity) await evtUserActivity.waitFor();

            log?.("User activity detected. Refreshing access token now");

            const error = await keycloakInstance.updateToken(-1).then(
                () => undefined,
                (error: Error) => error,
            );

            if (error) {
                log?.("Can't refresh OIDC access token, getting a new one");
                //NOTE: Never resolves
                await login({ "doesCurrentHrefRequiresAuth": true });
            }

            oidcClient.accessToken = keycloakInstance.token!;

            callee();
        }, msBeforeExpiration - minValiditySecond * 1000);
    })();

    return oidcClient;
}

const minValiditySecond = 25;

export async function creatOrFallbackOidcClient(params: {
    keycloakParams:
        | {
              url?: string;
              realm?: string;
              clientId: string;
          }
        | undefined;
    fallback:
        | {
              keycloakParams: {
                  url: string;
                  clientId: string;
                  realm: string;
              };
              oidcClient: OidcClient.LoggedIn;
          }
        | undefined;
    evtUserActivity: NonPostableEvt<void>;
}): Promise<OidcClient.LoggedIn> {
    const { keycloakParams, fallback, evtUserActivity } = params;

    const oidc = (() => {
        const { url, realm, clientId } = {
            ...keycloakParams,
            ...fallback?.keycloakParams,
        };

        assert(
            url !== undefined && clientId !== undefined && realm !== undefined,
            "There is no specific keycloak config in the region for s3 and no keycloak config to fallback to",
        );

        if (
            fallback !== undefined &&
            url === fallback.keycloakParams.url &&
            realm === fallback.keycloakParams.realm &&
            clientId === fallback.keycloakParams.clientId
        ) {
            return {
                "type": "oidc client",
                "oidcClient": fallback.oidcClient,
            } as const;
        }

        return {
            "type": "keycloak params",
            "keycloakParams": { url, realm, clientId },
            evtUserActivity,
        } as const;
    })();

    switch (oidc.type) {
        case "oidc client":
            return oidc.oidcClient;
        case "keycloak params": {
            const oidcClient = await createKeycloakOidcClient({
                ...oidc.keycloakParams,
                "transformUrlBeforeRedirectToLogin": undefined,
                "evtUserActivity": oidc.evtUserActivity,
            });

            if (!oidcClient.isUserLoggedIn) {
                await oidcClient.login({ "doesCurrentHrefRequiresAuth": true });
                assert(false);
            }

            return oidcClient;
        }
    }
}
