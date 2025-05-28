import { createGroup, defineRoute, createRouter, type Route } from "type-route";

export const routeDefs = {
    myFilesIndex: defineRoute("/my-files-index")
};

export const routeGroup = createGroup(Object.values(createRouter(routeDefs).routes));

export type PageRoute = Route<typeof routeGroup>;
