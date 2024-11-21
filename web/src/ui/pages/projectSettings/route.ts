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
import { tabIds, type TabId } from "./tabIds";

export const routeDefs = {
    projectSettings: defineRoute(
        {
            tabId: param.path.optional
                .ofType(
                    id<ValueSerializer<TabId>>({
                        parse: raw =>
                            !id<readonly string[]>(tabIds).includes(raw)
                                ? noMatch
                                : (raw as TabId),
                        stringify: value => value
                    })
                )
                .default(tabIds[0])
        },
        ({ tabId }) => `/project-settings/${tabId}`
    )
};

export const routeGroup = createGroup(Object.values(createRouter(routeDefs).routes));

export type PageRoute = Route<typeof routeGroup>;

export const getDoRequireUserLoggedIn: (route: PageRoute) => boolean = () => true;
