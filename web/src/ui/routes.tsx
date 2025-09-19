import { useEffect } from "react";
import { createRouter as createRouter_base, type Link, type Route } from "type-route";
import { routeDefs, routerOpts } from "ui/pages";
import { pluginSystemInitRouter } from "pluginSystem";
import { type LocalizedString, resolveLocalizedString, useLang } from "ui/i18n";
import { useMemo } from "react";
import { ensureUrlIsSafe } from "ui/shared/ensureUrlIsSafe";
import { useConstCallback } from "powerhooks/useConstCallback";

export type { Link };

function createAppRouter() {
    return createRouter_base(routerOpts, routeDefs);
}

type AppRouter = ReturnType<typeof createAppRouter>;

const GLOBAL_CONTEXT_KEY = "__onyxia.routes.globalContext";

declare global {
    interface Window {
        [GLOBAL_CONTEXT_KEY]: {
            appRouter: AppRouter | undefined;
        };
    }
}

window[GLOBAL_CONTEXT_KEY] ??= {
    appRouter: undefined
};

const globalContext = window[GLOBAL_CONTEXT_KEY];

export const { RouteProvider, useRoute, routes, session } = (globalContext.appRouter ??=
    createAppRouter());

pluginSystemInitRouter({ routes, session });

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
