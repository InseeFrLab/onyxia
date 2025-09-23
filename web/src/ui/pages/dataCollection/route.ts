import { createRouter, defineRoute, param, createGroup } from "type-route";

export const routeDefs = {
    dataCollection: defineRoute(
        {
            source: param.query.optional.string,
            rowsPerPage: param.query.optional.number,
            page: param.query.optional.number
        },
        () => `/data-collection`
    )
};

export const routeGroup = createGroup(routeDefs);
