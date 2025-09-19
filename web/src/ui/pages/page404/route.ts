import { createGroup, defineRoute } from "type-route";

export const routeDefs = {
    page404: defineRoute("/404")
};

export const routeGroup = createGroup(routeDefs);
