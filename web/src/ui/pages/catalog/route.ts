import { createRouter, defineRoute, param, createGroup, type Route } from "type-route";

export const routeDefs = {
    catalog: defineRoute(
        {
            catalogId: param.path.optional.string,
            search: param.query.optional.string.default("")
        },
        ({ catalogId }) => `/catalog/${catalogId}`
    )
};

export const routeGroup = createGroup(Object.values(createRouter(routeDefs).routes));

export type PageRoute = Route<typeof routeGroup>;
