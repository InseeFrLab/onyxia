
import type { KeycloakPromise, KeycloakInstance, KeycloakAdapter, KeycloakLoginOptions } from "keycloak-js";

/**
* NOTE: This is just a slightly modified version of the default adapter in keycloak-js
* The goal here is just to be able to inject search param in url before keycloak redirect.
* Our use case for it is to pass over the login screen the states of useGlobalState
* namely isDarkModeEnabled, lgn... 
*/
export function createKeycloakAdapter(
    params: {
        keycloakInstance: KeycloakInstance;
        transformUrlBeforeRedirect(url: string): string;
    }
): KeycloakAdapter {


    const { keycloakInstance, transformUrlBeforeRedirect } = params;

    const neverResolvingPromise: KeycloakPromise<void, void> = Object.defineProperties(
        new Promise(() => { }),
        {
            "success": { "value": () => { } },
            "error": { "value": () => { } }
        }
    );

    return {
        "login": (options) => {
            window.location.replace(
                transformUrlBeforeRedirect(
                    keycloakInstance.createLoginUrl(
                        options
                    )
                )
            );
            return neverResolvingPromise;
        },
        "logout": (options?: KeycloakLoginOptions) => {
            window.location.replace(
                transformUrlBeforeRedirect(
                    keycloakInstance.createLogoutUrl(
                        options
                    )
                )
            );
            return neverResolvingPromise;
        },
        "register": (options?: KeycloakLoginOptions) => {
            window.location.replace(
                transformUrlBeforeRedirect(
                    keycloakInstance.createRegisterUrl(
                        options
                    )
                )
            );
            return neverResolvingPromise;
        },
        "accountManagement": () => {
            var accountUrl = transformUrlBeforeRedirect(keycloakInstance.createAccountUrl());
            if (typeof accountUrl !== 'undefined') {
                window.location.href = accountUrl;
            } else {
                throw new Error("Not supported by the OIDC server");
            }
            return neverResolvingPromise;
        },
        "redirectUri": function (options?: KeycloakLoginOptions) {
            if (options && options.redirectUri) {
                return options.redirectUri;
            } else if (keycloakInstance.redirectUri) {
                return keycloakInstance.redirectUri;
            } else {
                return window.location.href;
            }
        }
    };


}