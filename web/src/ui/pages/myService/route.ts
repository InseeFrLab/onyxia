import { defineRoute, param, createGroup } from "type-route";

export const routeDefs = {
    myService: defineRoute(
        {
            helmReleaseName: param.path.string
        },
        ({ helmReleaseName }) => `/my-service/${helmReleaseName}`
    )
};

export const routeGroup = createGroup(routeDefs);
