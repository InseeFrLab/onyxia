import { id } from "tsafe/id";
import { addParamToUrl, retrieveParamFromUrl } from "powerhooks/tools/urlSearchParams";
import type { Oidc } from "core/ports/Oidc";

export function createOidc(params: { isUserInitiallyLoggedIn: boolean }): Oidc {
    const isUserLoggedIn = (() => {
        const result = retrieveParamFromUrl({
            "url": window.location.href,
            "name": urlParamName
        });

        return result.wasPresent
            ? result.value === "true"
            : params.isUserInitiallyLoggedIn;
    })();

    const common: Oidc.Common = {
        "params": {
            "authority": "",
            "clientId": ""
        }
    };

    if (!isUserLoggedIn) {
        return id<Oidc.NotLoggedIn>({
            ...common,
            "isUserLoggedIn": false,
            "login": async () => {
                const { newUrl } = addParamToUrl({
                    "url": window.location.href,
                    "name": urlParamName,
                    "value": "true"
                });

                window.location.href = newUrl;

                return new Promise<never>(() => {});
            }
        });
    }

    return id<Oidc.LoggedIn>({
        ...common,
        "isUserLoggedIn": true,
        "getTokens": () => ({
            "accessToken": "",
            "idToken": "",
            "refreshToken": "",
            "refreshTokenExpirationTime": Infinity
        }),
        "logout": () => {
            const { newUrl } = addParamToUrl({
                "url": window.location.href,
                "name": urlParamName,
                "value": "false"
            });

            window.location.href = newUrl;

            return new Promise<never>(() => {});
        },
        "renewTokens": () => Promise.reject("Not implemented")
    });
}

const urlParamName = "isUserAuthenticated";
