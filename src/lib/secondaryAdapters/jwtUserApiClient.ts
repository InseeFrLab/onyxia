import * as jwtSimple from "jwt-simple";
import type { UserApiClient } from "../ports/UserApiClient";
import { assert } from "tsafe/assert";

export function createJwtUserApiClient(params: {
    oidcClaims: {
        email: string;
        familyName: string;
        fistName: string;
        userName: string;
        groups: string;
        local: string;
    };
    getOidcAccessToken: () => Promise<string>;
}): UserApiClient {
    const { oidcClaims, getOidcAccessToken } = params;

    return {
        "getUser": async () => {
            const parsedJwt: Record<string, any> = jwtSimple.decode(
                await getOidcAccessToken(),
                "",
                true,
            );

            return {
                "email": parsedJwt[oidcClaims.email] ?? "no-email-in-jwt@example.com",
                "familyName": parsedJwt[oidcClaims.familyName] ?? "FAMILY NAME",
                "firstName": parsedJwt[oidcClaims.fistName] ?? "FIRST NAME",
                "username": (() => {
                    const username = parsedJwt[oidcClaims.fistName];

                    assert(!!username, `Could not read ${oidcClaims.userName} in JWT`);

                    return username;
                })(),
                "groups": parsedJwt[oidcClaims.groups] ?? [],
                "kcLanguageTag": parsedJwt[oidcClaims.local] ?? "en",
            };
        },
    };
}
