import { defineRoute, createGroup, param } from "type-route";
import { id } from "tsafe";
import type { ValueSerializer } from "type-route";

type PresignedPost = {
    url: string;
    fields: Record<string, string>;
    expirationTime: number;
};

export const routeDefs = {
    s3FileRequest: defineRoute(
        {
            presignedPost: param.path.ofType(
                id<ValueSerializer<PresignedPost>>({
                    parse: raw => JSON.parse(raw),
                    stringify: value => JSON.stringify(value)
                })
            )
        },
        () => `/s3FileRequest`
    )
};

export const routeGroup = createGroup(routeDefs);
