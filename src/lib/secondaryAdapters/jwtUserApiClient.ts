import * as jwtSimple from "jwt-simple";
import type { UserApiClient, User } from "../ports/UserApiClient";
import { assert } from "tsafe/assert";

export function createJwtUserApiClient(params: {
    oidcClaims: Record<keyof User, string>;
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
                "firstName": parsedJwt[oidcClaims.firstName] ?? "FIRST NAME",
                "username": (() => {
                    const username = parsedJwt[oidcClaims.firstName];

                    assert(!!username, `Could not read ${oidcClaims.username} in JWT`);

                    return username;
                })(),
                "groups": parsedJwt[oidcClaims.groups] ?? [],
                "local": parsedJwt[oidcClaims.local] ?? "en",
            };
        },
    };
}
