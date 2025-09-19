import { useEffect } from "react";
import { createRouter, type Link, type Route } from "type-route";
import { routeDefs, routerOpts } from "ui/pages";
import { pluginSystemInitRouter } from "pluginSystem";
import { type LocalizedString, resolveLocalizedString, useLang } from "ui/i18n";
import { useMemo } from "react";
import { ensureUrlIsSafe } from "ui/shared/ensureUrlIsSafe";
import { useConstCallback } from "powerhooks/useConstCallback";

export type { Link };

export const { RouteProvider, useRoute, getRoute, routes, session } = createRouter(
    routerOpts,
    routeDefs
);

pluginSystemInitRouter({ routes, session });

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
