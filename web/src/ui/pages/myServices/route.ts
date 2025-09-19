import { defineRoute, param, createGroup } from "type-route";

export const routeDefs = {
    myServices: defineRoute(
        {
            isSavedConfigsExtended: param.query.optional.boolean.default(false),
            autoOpenHelmReleaseName: param.query.optional.string
        },
        () => `/my-services`
    )
};

export const routeGroup = createGroup(routeDefs);
