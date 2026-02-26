import { defineRoute, createGroup, param } from "type-route";

export const routeDefs = {
    s3Explorer: defineRoute(
        {
            s3UriPrefixWithoutScheme: param.path.trailing.ofType({
                parse: raw => decodeURIComponent(raw), // decode the path
                stringify: value => encodeURI(value) // encode when creating URL
            }),
            profile: param.query.optional.string
        },
        ({ s3UriPrefixWithoutScheme }) => `/s3/${s3UriPrefixWithoutScheme}`
    ),
    s3Explorer_root: defineRoute(
        {
            s3UriPrefixWithoutScheme: param.query.optional.string.default(""),
            profile: param.query.optional.string
        },
        () => "/s3"
    )
};

export const routeGroup = createGroup(routeDefs);
