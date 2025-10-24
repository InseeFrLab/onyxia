import { defineRoute, createGroup, param } from "type-route";
import { type ValueSerializer } from "type-route";
import { id } from "tsafe";

export const routeDefs = {
    s3Explorer: defineRoute(
        {
            bucket: param.query.optional.string,
            prefix: param.query.optional.ofType(
                id<ValueSerializer<string>>({
                    parse: raw => raw.replace(/\u2044/g, "/"),
                    stringify: value => value.replace(/\//g, "\u2044")
                })
            ),
            profile: param.query.optional.string
        },
        () => `/s3`
    )
};

export const routeGroup = createGroup(routeDefs);
