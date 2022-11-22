import type { CreateDecodeJwt } from "../port/CreateDecodeJwt";
import * as jwtSimple from "jwt-simple";
import { jwtContentToDecodedJwt } from "../tools/jwtContentToDecodedJwt";

export const createDecodeJwtNoVerify: CreateDecodeJwt = ({ jwtClaims }) => {
    const decodeJwt: ReturnType<CreateDecodeJwt>["decodeJwt"] = ({ jwtToken }) =>
        Promise.resolve(
            jwtContentToDecodedJwt({
                jwtClaims,
                "jwtPayload": jwtSimple.decode(jwtToken, "", true)
            })
        );

    return { decodeJwt };
};
