import "minimal-polyfills/Object.fromEntries";
import type { OidcClient } from "../ports/OidcClient";
import { id } from "tsafe/id";
import * as jwtSimple from "jwt-simple";
import { addParamToUrl, retrieveParamFromUrl } from "powerhooks/tools/urlSearchParams";
import type { createJwtUserApiClient } from "./jwtUserApiClient";
import type { Param0 } from "tsafe";
import { objectKeys } from "tsafe/objectKeys";
import type { User } from "../ports/UserApiClient";

export async function createPhonyOidcClient(params: {
    isUserLoggedIn: boolean;
    user: User;
}): Promise<OidcClient> {
    const isUserLoggedIn = (() => {
        const result = retrieveParamFromUrl({
            "url": window.location.href,
            "name": urlParamName,
        });

        return result.wasPresent ? result.value === "true" : params.isUserLoggedIn;
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
        "getAccessToken": (() => {
            const { user } = params;

            const accessToken = jwtSimple.encode(
                Object.fromEntries(
                    objectKeys(phonyClientOidcClaims).map(key => [
                        phonyClientOidcClaims[key],
                        user[key],
                    ]),
                ),
                "xxx",
            );

            return () => Promise.resolve(accessToken);
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

export const phonyClientOidcClaims: Param0<typeof createJwtUserApiClient>["oidcClaims"] =
    {
        "email": "a",
        "familyName": "b",
        "firstName": "c",
        "username": "d",
        "groups": "e",
        "local": "f",
    };
