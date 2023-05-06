import { createRouter, defineRoute, createGroup, param, type Route } from "type-route";
import { paramPathTrailingOptional } from "ui/tools/typeRouteParamPathTrailingOptional";

export const routeDefs = {
    "myFiles": defineRoute(
        {
            "path": paramPathTrailingOptional,
            "openFile": param.query.optional.string
        },
        ({ path }) => `/my-files/${path}`
    )
};

export const routeGroup = createGroup(Object.values(createRouter(routeDefs).routes));

export type PageRoute = Route<typeof routeGroup>;

export const getDoRequireUserLoggedIn: (route: PageRoute) => boolean = () => true;
