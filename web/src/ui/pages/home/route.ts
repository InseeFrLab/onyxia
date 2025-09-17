import { createRouter, defineRoute, createGroup } from "type-route";

export const routeDefs = {
    home: defineRoute(["/", "/home", "/accueil"])
};

export const routeGroup = createGroup(Object.values(createRouter(routeDefs).routes));
