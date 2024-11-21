import { createRouter, defineRoute, createGroup, param, type Route } from "type-route";

export const routeDefs = {
    mySecrets: defineRoute(
        {
            path: param.path.trailing.optional.string,
            openFile: param.query.optional.string
        },
        ({ path }) => `/my-secrets/${path}`
    )
};

export const routeGroup = createGroup(Object.values(createRouter(routeDefs).routes));

export type PageRoute = Route<typeof routeGroup>;

export const getDoRequireUserLoggedIn: (route: PageRoute) => boolean = () => true;
