import { defineRoute, createGroup } from "type-route";

export const routeDefs = {
    fileExplorerEntry: defineRoute([`/file-explorer`, `/my-files`])
};

export const routeGroup = createGroup(routeDefs);
