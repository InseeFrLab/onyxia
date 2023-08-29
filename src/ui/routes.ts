import { createRouter } from "type-route";
import { createTypeRouteMock } from "ui/tools/typeRouteMock";
import { isStorybook } from "ui/tools/isStorybook";
import { routeDefs, routerOpts } from "ui/pages";

const {
    RouteProvider,
    useRoute,
    routes: realRoutes,
    session
} = createRouter(routerOpts, routeDefs);

export { RouteProvider, useRoute, session };

const { createMockRouteFactory, routesProxy } = createTypeRouteMock({
    "routes": realRoutes
});

export const routes = isStorybook ? routesProxy : realRoutes;

export { createMockRouteFactory };

export const { getPreviousRouteName } = (() => {
    let previousRouteName: keyof typeof realRoutes | false = false;
    let currentRouteName: keyof typeof realRoutes | false =
        session.getInitialRoute().name;

    session.listen(nextRoute => {
        previousRouteName = currentRouteName;

        currentRouteName = nextRoute.name;
    });

    function getPreviousRouteName() {
        return previousRouteName;
    }

    return { getPreviousRouteName };
})();
