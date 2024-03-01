import { createRouter, defineRoute, param, createGroup, type Route } from "type-route";

export const routeDefs = {
    "myServices2": defineRoute(
        {
            "foo": param.query.optional.string
        },
        () => `/my-services2`
    )
};

export const routeGroup = createGroup(Object.values(createRouter(routeDefs).routes));

export type PageRoute = Route<typeof routeGroup>;

export const getDoRequireUserLoggedIn: (route: PageRoute) => boolean = () => true;
