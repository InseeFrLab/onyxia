import "minimal-polyfills/Object.fromEntries";
import type { OidcClient } from "../ports/OidcClient";
import { id } from "tsafe/id";
import * as jwtSimple from "jwt-simple";
import { addParamToUrl, retrieveParamFromUrl } from "powerhooks/tools/urlSearchParams";
import { objectKeys } from "tsafe/objectKeys";
import type { User } from "../ports/UserApiClient";

export function createPhonyOidcClient(params: {
    jwtClaims: Record<keyof User, string>;
    isUserInitiallyLoggedIn: boolean;
    user: User;
}): OidcClient {
    const isUserLoggedIn = (() => {
        const result = retrieveParamFromUrl({
            "url": window.location.href,
            "name": urlParamName,
        });

        return result.wasPresent
            ? result.value === "true"
            : params.isUserInitiallyLoggedIn;
    })();

    if (!isUserLoggedIn) {
        return id<OidcClient.NotLoggedIn>({
            "isUserLoggedIn": false,
            "login": async () => {
                const { newUrl } = addParamToUrl({
                    "url": window.location.href,
                    "name": urlParamName,
                    "value": "true",
                });

                window.location.href = newUrl;

                return new Promise<never>(() => {});
            },
        });
    }

    return id<OidcClient.LoggedIn>({
        "isUserLoggedIn": true,
        ...(() => {
            const { jwtClaims, user } = params;

            const accessToken = jwtSimple.encode(
                Object.fromEntries(
                    objectKeys(jwtClaims).map(key => [jwtClaims[key], user[key]]),
                ),
                "xxx",
            );

            return { accessToken, "expirationTime": 0 };
        })(),
        "logout": () => {
            const { newUrl } = addParamToUrl({
                "url": window.location.href,
                "name": urlParamName,
                "value": "false",
            });

            window.location.href = newUrl;

            return new Promise<never>(() => {});
        },
    });
}

const urlParamName = "isUserAuthenticated";
