import { createGroup, defineRoute, createRouter, type Route } from "type-route";

export const routeDefs = {
    page404: defineRoute("/404")
};

export const routeGroup = createGroup(Object.values(createRouter(routeDefs).routes));

export type PageRoute = Route<typeof routeGroup>;
