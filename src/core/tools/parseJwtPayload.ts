import "minimal-polyfills/Object.fromEntries";
import type { ZodObject } from "zod";

export function parseJwtPayload<Z extends ZodObject<any>>(params: {
    zParsedJwtTokenPayload: Z;
    jwtClaims: Record<keyof ReturnType<Z["parse"]>, string>;
    jwtPayload: Record<string, unknown>;
}): ReturnType<Z["parse"]> {
    const { zParsedJwtTokenPayload, jwtClaims, jwtPayload } = params;

    return zParsedJwtTokenPayload.parse(
        Object.fromEntries(
            Object.entries(jwtClaims).map(([key, claimName]) => [
                key,
                jwtPayload[claimName],
            ]),
        ),
    ) as any;
}
