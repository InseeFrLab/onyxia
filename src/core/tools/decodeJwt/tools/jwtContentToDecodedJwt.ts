import { id } from "tsafe/id";
import { assert } from "tsafe/assert";

export function jwtContentToDecodedJwt<ClaimName extends string>(params: {
    jwtClaims: Record<ClaimName, string>;
    jwtPayload: Record<string, unknown>;
}): Record<ClaimName, string> {
    const { jwtClaims, jwtPayload } = params;

    return Promise.resolve(
        Object.fromEntries(
            Object.entries(id<Record<string, string>>(jwtClaims)).map(
                ([propertyName, propertyNameInJwtPayload]) => {
                    const value = jwtPayload[propertyNameInJwtPayload];

                    assert(
                        typeof value !== undefined,
                        `${propertyName} could not be read from JWT payload, ${propertyNameInJwtPayload} is not defined in ${JSON.stringify(
                            jwtPayload,
                        )}`,
                    );

                    return [
                        propertyName,
                        typeof value === "string" ? value : JSON.stringify(value),
                    ] as const;
                },
            ),
        ),
    ) as any;
}
