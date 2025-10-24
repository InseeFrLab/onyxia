import { defineRoute, createGroup, param } from "type-route";

export const routeDefs = {
    s3Explorer: defineRoute(
        {
            bucket: param.query.optional.string,
            prefix: param.query.optional.string,
            profile: param.query.optional.string
        },
        () => `/s3`
    )
};

export const routeGroup = createGroup(routeDefs);
