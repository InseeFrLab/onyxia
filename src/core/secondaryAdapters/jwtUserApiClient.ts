import type { UserApiClient, User } from "../ports/UserApiClient";
import * as jwtSimple from "jwt-simple";
import { parseJwtPayload } from "../tools/parseJwtPayload";
import { z } from "zod";
import type { Equals } from "tsafe";
import { assert } from "tsafe/assert";

export function createJwtUserApiClient(params: {
    jwtClaims: Record<keyof User, string>;
    getOidcAccessToken: () => string;
}): UserApiClient {
    const { jwtClaims, getOidcAccessToken } = params;

    return {
        "getUser": () =>
            Promise.resolve(
                parseJwtPayload({
                    jwtClaims,
                    "jwtPayload": jwtSimple.decode(getOidcAccessToken(), "", true),
                    zParsedJwtTokenPayload,
                }),
            ),
    };
}

const zParsedJwtTokenPayload = z.object({
    "email": z.string(),
    "familyName": z.string(),
    "firstName": z.string(),
    "username": z.string(),
    "groups": z.array(z.string()).optional(),
    "locale": z.string().optional(),
});

assert<Equals<z.infer<typeof zParsedJwtTokenPayload>, User>>();
