import "minimal-polyfills/Object.fromEntries";
import { id } from "tsafe/id";
import { encodeJwt } from "core/tools/jwt";
import { addParamToUrl, retrieveParamFromUrl } from "powerhooks/tools/urlSearchParams";
import { objectKeys } from "tsafe/objectKeys";
import type { Oidc } from "../ports/Oidc";
import type { User } from "../ports/GetUser";

export function createOidc(params: {
    isUserInitiallyLoggedIn: boolean;
    jwtClaimByUserKey: Record<keyof User, string>;
    user: User;
}): Oidc {
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
        "getAccessToken": (() => {
            const { jwtClaimByUserKey, user } = params;

            const accessToken = encodeJwt(
                Object.fromEntries(
                    objectKeys(jwtClaimByUserKey).map(key => [
                        jwtClaimByUserKey[key],
                        user[key]
                    ])
                )
            );

            return () => ({
                accessToken,
                "expirationTime": Infinity
            });
        })(),
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
