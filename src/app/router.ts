
import { createRouter, defineRoute, param } from "type-route";

const routeDefs = {
  "home": defineRoute(["/home", "/"]),
  "mySecrets": defineRoute(
    { "directoryPath": param.path.trailing.optional.string },
    ({ directoryPath }) => `/my-secrets/${directoryPath}`
  )
};




export const { RouteProvider, useRoute, routes } = createRouter(routeDefs);