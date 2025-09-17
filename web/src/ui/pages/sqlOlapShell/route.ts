import { createRouter, defineRoute, createGroup } from "type-route";

export const routeDefs = {
    sqlOlapShell: defineRoute("/sql-olap-shell")
};

export const routeGroup = createGroup(Object.values(createRouter(routeDefs).routes));
