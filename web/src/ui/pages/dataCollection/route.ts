import { defineRoute, param, createGroup } from "type-route";

export const routeDefs = {
    dataCollection: defineRoute(
        {
            source: param.query.optional.string
        },
        () => `/data-collection`
    )
};

export const routeGroup = createGroup(routeDefs);
