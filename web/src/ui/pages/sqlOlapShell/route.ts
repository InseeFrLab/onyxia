import { createRouter, defineRoute, createGroup, type Route } from "type-route";

export const routeDefs = {
    sqlOlapShell: defineRoute("/sql-olap-shell")
};

export const routeGroup = createGroup(Object.values(createRouter(routeDefs).routes));

export type PageRoute = Route<typeof routeGroup>;

export const getDoRequireUserLoggedIn: (route: PageRoute) => boolean = () => true;
