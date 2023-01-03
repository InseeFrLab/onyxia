import "minimal-polyfills/Object.fromEntries";
import { createRouter, defineRoute, param, noMatch } from "type-route";
import type { ValueSerializer } from "type-route";
import { id } from "tsafe/id";
import type { AccountTabId } from "ui/components/pages/Account/accountTabIds";
import { accountTabIds } from "ui/components/pages/Account/accountTabIds";
import { routerOpts, formFieldsDefineRouteParam } from "./formFieldsQueryParameters";
import { paramPathTrailingOptional } from "ui/tools/typeRouteParamPathTrailingOptional";

export const { RouteProvider, useRoute, routes } = createRouter(routerOpts, {
    "account": defineRoute(
        {
            "tabId": param.path.optional
                .ofType(
                    id<ValueSerializer<AccountTabId>>({
                        "parse": raw =>
                            !id<readonly string[]>(accountTabIds).includes(raw)
                                ? noMatch
                                : (raw as AccountTabId),
                        "stringify": value => value
                    })
                )
                .default(accountTabIds[0])
        },
        ({ tabId }) => `/account/${tabId}`
    ),
    "home": defineRoute(["/home", "/", "/accueil"]),
    "catalogExplorer": defineRoute(
        {
            "catalogId": param.path.optional.string,
            "search": param.query.optional.string.default("")
        },
        ({ catalogId }) => `/catalog/${catalogId}`
    ),
    "catalogLauncher": defineRoute(
        {
            "catalogId": param.path.string,
            "packageName": param.path.string,
            "autoLaunch": param.query.optional.boolean.default(false),
            ...formFieldsDefineRouteParam
        },
        ({ catalogId, packageName }) => `/launcher/${catalogId}/${packageName}`
    ),
    ...(() => {
        const myServices = defineRoute("/my-service");

        return {
            "myService": myServices.extend(
                { "serviceId": param.path.string },
                ({ serviceId }) => `/${serviceId}`
            )
        };
    })(),
    "myServices": defineRoute(
        {
            "isSavedConfigsExtended": param.query.optional.boolean.default(false),
            "autoLaunchServiceId": param.query.optional.string
        },
        () => `/my-services`
    ),
    ...(() => {
        const buildExplorerRoute = (prefix: string) =>
            defineRoute(
                {
                    "path": paramPathTrailingOptional,
                    "openFile": param.query.optional.string
                },
                ({ path }) => `/${prefix}/${path}`
            );

        return {
            "mySecrets": buildExplorerRoute("my-secrets"),
            "myFiles": buildExplorerRoute("my-files")
        };
    })(),
    "terms": defineRoute("/terms")
});
