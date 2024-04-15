import {
    createRouter,
    defineRoute,
    param,
    noMatch,
    createGroup,
    type Route
} from "type-route";
import type { ValueSerializer } from "type-route";
import { id } from "tsafe/id";
import { tabIds, type TabIds } from "./tabIds";

export const routeDefs = {
    "myService": defineRoute(
        {
            "helmReleaseName": param.path.string,
            "tabId": param.path.optional
                .ofType(
                    id<ValueSerializer<TabIds>>({
                        "parse": raw =>
                            !id<readonly string[]>(tabIds).includes(raw)
                                ? noMatch
                                : (raw as TabIds),
                        "stringify": value => value
                    })
                )
                .default(tabIds[0]),
            "pod": param.query.optional.string
        },
        ({ tabId, helmReleaseName }) => `/my-service/${helmReleaseName}/${tabId}`
    )
};

export const routeGroup = createGroup(Object.values(createRouter(routeDefs).routes));

export type PageRoute = Route<typeof routeGroup>;

export const getDoRequireUserLoggedIn: (route: PageRoute) => boolean = () => true;
