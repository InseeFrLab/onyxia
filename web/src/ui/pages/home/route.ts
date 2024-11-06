import { createRouter, defineRoute, createGroup, type Route } from "type-route";

export const routeDefs = {
    home: defineRoute(["/", "/home", "/accueil"])
};

export const routeGroup = createGroup(Object.values(createRouter(routeDefs).routes));

export type PageRoute = Route<typeof routeGroup>;

export const getDoRequireUserLoggedIn: (route: PageRoute) => boolean = () => false;
