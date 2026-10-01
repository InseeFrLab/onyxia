import { createGroup, defineRoute } from "type-route";

export const routeDefs = {
    icebergCatalog: defineRoute(`/iceberg-catalog`)
};

export const routeGroup = createGroup(routeDefs);
