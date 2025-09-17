import { createGroup, defineRoute, createRouter } from "type-route";

export const routeDefs = {
    page404: defineRoute("/404")
};

export const routeGroup = createGroup(Object.values(createRouter(routeDefs).routes));
