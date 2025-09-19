import { defineRoute, createGroup } from "type-route";

export const routeDefs = {
    home: defineRoute(["/", "/home", "/accueil"])
};

export const routeGroup = createGroup(routeDefs);
