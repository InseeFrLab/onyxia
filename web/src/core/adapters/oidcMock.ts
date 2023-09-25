import "minimal-polyfills/Object.fromEntries";
import { id } from "tsafe/id";
import { addParamToUrl, retrieveParamFromUrl } from "powerhooks/tools/urlSearchParams";
import type { Oidc } from "../ports/Oidc";

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

    if (!isUserLoggedIn) {
        return id<Oidc.NotLoggedIn>({
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
        "isUserLoggedIn": true,
        "getAccessToken": () => ({
            "accessToken": "--OIDC ACCESS TOKEN--",
            "expirationTime": Infinity
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
        "renewToken": () => Promise.reject("Not implemented")
    });
}

const urlParamName = "isUserAuthenticated";
