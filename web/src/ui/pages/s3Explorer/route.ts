import { defineRoute, createGroup, param } from "type-route";

export const routeDefs = {
    s3Explorer: defineRoute(
        {
            path: param.path.trailing.ofType({
                parse: raw => decodeURIComponent(raw), // decode the path
                stringify: value => encodeURI(value) // encode when creating URL
            }),
            profile: param.query.optional.string
        },
        ({ path }) => `/s3/${path}`
    )
};

export const routeGroup = createGroup(routeDefs);
