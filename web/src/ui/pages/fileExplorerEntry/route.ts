import { createRouter, defineRoute, createGroup } from "type-route";

export const routeDefs = {
    fileExplorerEntry: defineRoute([`/file-explorer`, `/my-files`])
};

export const routeGroup = createGroup(Object.values(createRouter(routeDefs).routes));
