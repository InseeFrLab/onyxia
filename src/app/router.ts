
import { createRouter, defineRoute, param } from "type-route";

const routeDefs = {
  "home": defineRoute(["/home", "/"]),
  "mySecrets": defineRoute(
    { "directoryPath": param.path.trailing.optional.string },
    ({ directoryPath }) => `/my-secrets/${directoryPath}`
  ),
  "catalog": defineRoute(
    { "optionalTrailingPath": param.path.trailing.optional.string },
    ({ optionalTrailingPath }) => `/my-lab/catalogue/${optionalTrailingPath}`
  ),
  "myServices": defineRoute(
    { "serviceId": param.path.optional.string },
    ({ serviceId }) => `/my-service/${serviceId}`
  )
};

export const { RouteProvider, useRoute, routes } = createRouter(routeDefs);
