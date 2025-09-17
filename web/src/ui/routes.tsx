import { useContext, createContext, useEffect, type ReactNode } from "react";
import { createRouter, type Link, type Route } from "type-route";
import { routeDefs, routerOpts } from "ui/pages";
import { pluginSystemInitRouter } from "pluginSystem";
import { type LocalizedString, resolveLocalizedString, useLang } from "ui/i18n";
import { useMemo } from "react";
import { ensureUrlIsSafe } from "ui/shared/ensureUrlIsSafe";
import { useConstCallback } from "powerhooks/useConstCallback";

export type { Link };

const {
    RouteProvider: RouteProvider_base,
    useRoute: useRoute_base,
    routes,
    session
} = createRouter(routerOpts, routeDefs);

export { routes, session };

pluginSystemInitRouter({ routes, session });

export const { RouteProvider, useRoute } = (() => {
    const contextIsProvided = createContext(false);

    function RouteProvider(props: { children: ReactNode }) {
        const { children } = props;

        return (
            <contextIsProvided.Provider value={true}>
                <RouteProvider_base>{children}</RouteProvider_base>
            </contextIsProvided.Provider>
        );
    }

    const useRoute: typeof useRoute_base = () => {
        const isProvided = useContext(contextIsProvided);
        if (!isProvided) {
            console.log("HMR, reload");
            window.location.reload();
            throw new Promise<never>(() => {});
        }
        return useRoute_base();
    };

    return { RouteProvider, useRoute };
})();

export const { getRoute } = (() => {
    let route_current = session.getInitialRoute();

    session.listen(route => (route_current = route));

    function getRoute() {
        return route_current;
    }

    return { getRoute };
})();

export function useUrlToLink() {
    const lang = useLang();

    const urlToLink_dynamic = useMemo(
        () => (url: LocalizedString) => urlToLink(url),
        [lang]
    );

    return { urlToLink: urlToLink_dynamic };
}

export function urlToLink(url: LocalizedString): Link & { target?: "_blank" } {
    const url_str = resolveLocalizedString(url);

    const isInternalUrl = (() => {
        try {
            ensureUrlIsSafe(url_str);
        } catch {
            return false;
        }

        return true;
    })();

    if (!isInternalUrl) {
        return {
            href: url_str,
            target: "_blank",
            onClick: () => {
                /* nothing */
            }
        };
    }

    if (url_str.endsWith(".md")) {
        return routes.document({
            source: url
        }).link;
    }

    return {
        href: url_str,
        onClick: e => {
            e.preventDefault();
            session.push(url_str);
        }
    };
}

export const { getPreviousRouteName } = (() => {
    let previousRouteName: keyof typeof routes | false = false;
    let currentRouteName: keyof typeof routes | false = session.getInitialRoute().name;

    session.listen(nextRoute => {
        previousRouteName = currentRouteName;

        currentRouteName = nextRoute.name;
    });

    function getPreviousRouteName() {
        return previousRouteName;
    }

    return { getPreviousRouteName };
})();

export function useNavigationInterceptor(params: {
    getDoProceedWithNavigation: (prams: {
        route: Route<typeof routes>;
    }) => Promise<{ doProceedWithNavigation: boolean }>;
}) {
    const getDoProceedWithNavigation = useConstCallback(
        params.getDoProceedWithNavigation
    );

    useEffect(() => {
        const unblock = session.block(async update => {
            const { doProceedWithNavigation } = await getDoProceedWithNavigation({
                route: update.route
            });

            if (!doProceedWithNavigation) {
                return;
            }

            unblock();
            update.retry();
        });

        return () => {
            unblock();
        };
    }, []);
}
