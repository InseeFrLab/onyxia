import { createRouter, defineRoute, param, createGroup, type Route } from "type-route";

export const routeDefs = {
    "myServices": defineRoute(
        {
            "isSavedConfigsExtended": param.query.optional.boolean.default(false),
            "autoLaunchServiceId": param.query.optional.string
        },
        () => `/my-services`
    )
};

export const routeGroup = createGroup(Object.values(createRouter(routeDefs).routes));

export type PageRoute = Route<typeof routeGroup>;

export const getDoRequireUserLoggedIn: (route: PageRoute) => boolean = () => true;
