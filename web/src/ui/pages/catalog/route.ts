import { defineRoute, param, createGroup } from "type-route";

export const routeDefs = {
    catalog: defineRoute(
        {
            catalogId: param.path.optional.string,
            search: param.query.optional.string.default("")
        },
        ({ catalogId }) => `/catalog/${catalogId}`
    )
};

export const routeGroup = createGroup(routeDefs);
