import { createRouter, type Link } from "type-route";
import { routeDefs, routerOpts } from "ui/pages";
import { pluginSystemInitRouter } from "pluginSystem";

export const { RouteProvider, useRoute, routes, session } = createRouter(
    routerOpts,
    routeDefs
);

pluginSystemInitRouter({ routes, session });

export function urlToLink(url: string): Link & { target?: "_blank" } {
    const isLocalUrl = url.startsWith("/");

    return {
        "href": url,
        "onClick": !isLocalUrl
            ? () => {
                  /* nothing */
              }
            : e => {
                  e.preventDefault();
                  session.push(url);
              },
        ...(isLocalUrl ? {} : { "target": "_blank" })
    };
}
