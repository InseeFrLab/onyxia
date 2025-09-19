import { defineRoute, createGroup, param } from "type-route";

export const routeDefs = {
    mySecrets: defineRoute(
        {
            path: param.path.trailing.optional.string,
            openFile: param.query.optional.string
        },
        ({ path }) => `/my-secrets/${path}`
    )
};

export const routeGroup = createGroup(routeDefs);
