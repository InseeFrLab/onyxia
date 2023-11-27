import { createRouter, defineRoute, param, createGroup, type Route } from "type-route";

export const routeDefs = {
    "dataExplorer": defineRoute(
        {
            "source": param.query.optional.string,
            "limit": param.query.optional.number,
            "page": param.query.optional.number
        },
        () => `/data-explorer`
    )
};

export const routeGroup = createGroup(Object.values(createRouter(routeDefs).routes));

export type PageRoute = Route<typeof routeGroup>;

export const getDoRequireUserLoggedIn: (route: PageRoute) => boolean = () => false;
