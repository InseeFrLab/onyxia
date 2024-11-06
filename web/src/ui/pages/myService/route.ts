import { createRouter, defineRoute, param, createGroup, type Route } from "type-route";

export const routeDefs = {
    myService: defineRoute(
        {
            helmReleaseName: param.path.string
        },
        ({ helmReleaseName }) => `/my-service/${helmReleaseName}`
    )
};

export const routeGroup = createGroup(Object.values(createRouter(routeDefs).routes));

export type PageRoute = Route<typeof routeGroup>;

export const getDoRequireUserLoggedIn: (route: PageRoute) => boolean = () => true;
