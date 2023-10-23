import { decodeJwt } from "./jwt";
import { assert } from "tsafe/assert";

// Return undefined if token provided wasn't a JWT or if it hasn't an exp claim number
export function readExpirationTimeInJwt(token: string): number | undefined {
    let expirationTime: number;

    try {
        expirationTime = decodeJwt<{ exp: number }>(token).exp * 1000;

        assert(typeof expirationTime === "number" && !isNaN(expirationTime));
    } catch {
        return undefined;
    }

    return expirationTime;
}
