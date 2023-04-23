import type { User, GetUser } from "../ports/GetUser";
import * as jwtSimple from "core/tools/jwt";
import { parseJwtPayload } from "../tools/parseJwtPayload";
import { z } from "zod";
import type { Equals } from "tsafe";
import { assert } from "tsafe/assert";

export function createGetUser(params: {
    jwtClaimByUserKey: Record<keyof User, string>;
    getOidcAccessToken: () => string;
}) {
    const { jwtClaimByUserKey, getOidcAccessToken } = params;

    const getUser: GetUser = async () =>
        parseJwtPayload({
            "jwtClaims": jwtClaimByUserKey,
            "jwtPayload": jwtSimple.decodeJwt(getOidcAccessToken()),
            zParsedJwtTokenPayload
        });

    return { getUser };
}

const zParsedJwtTokenPayload = z.object({
    "email": z.string(),
    "familyName": z.string().optional(),
    "firstName": z.string().optional(),
    "username": z.string(),
    "groups": z.array(z.string()).optional()
});

assert<Equals<z.infer<typeof zParsedJwtTokenPayload>, User>>();
