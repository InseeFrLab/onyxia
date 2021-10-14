import "minimal-polyfills/Object.fromEntries";
import type { OidcClient } from "../ports/OidcClient";
import { id } from "tsafe/id";
import * as jwtSimple from "jwt-simple";
import { urlSearchParams } from "powerhooks/tools/urlSearchParams";
import type { createJwtUserApiClient } from "./jwtUserApiClient";
import type { Param0 } from "tsafe";
import { objectKeys } from "tsafe/objectKeys";
import type { User } from "../ports/UserApiClient";

export async function createPhonyOidcClient(params: {
    isUserLoggedIn: boolean;
    user: User;
}): Promise<OidcClient> {
    const isUserLoggedIn = (() => {
        const urlParamValue: string | undefined = urlSearchParams.retrieve({
            "locationSearch": window.location.search,
            "prefix": urlParam,
        }).values[urlParam];

        return urlParamValue !== undefined
            ? urlParamValue === "true"
            : params.isUserLoggedIn;
    })();

    if (!isUserLoggedIn) {
        return id<OidcClient.NotLoggedIn>({
            "isUserLoggedIn": false,
            "login": async () => {
                const { newUrl } = urlSearchParams.add({
                    "url": window.location.href,
                    "name": urlParam,
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
            const { newUrl } = urlSearchParams.add({
                "url": window.location.href,
                "name": urlParam,
                "value": "false",
            });

            window.location.href = newUrl;

            return new Promise<never>(() => {});
        },
    });
}

const urlParam = "isUserAuthenticated";

export const phonyClientOidcClaims: Param0<typeof createJwtUserApiClient>["oidcClaims"] =
    {
        "email": "a",
        "familyName": "b",
        "firstName": "c",
        "username": "d",
        "groups": "e",
        "local": "f",
    };
