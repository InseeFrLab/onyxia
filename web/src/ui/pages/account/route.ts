import { createRouter, defineRoute, param, noMatch, createGroup } from "type-route";
import type { ValueSerializer } from "type-route";
import { id } from "tsafe/id";
import { accountTabIds, type AccountTabId } from "./accountTabIds";

export const routeDefs = {
    account: defineRoute(
        {
            tabId: param.path.optional
                .ofType(
                    id<ValueSerializer<AccountTabId>>({
                        parse: raw =>
                            !id<readonly string[]>(accountTabIds).includes(raw)
                                ? noMatch
                                : (raw as AccountTabId),
                        stringify: value => value
                    })
                )
                .default(accountTabIds[0])
        },
        ({ tabId }) => `/account/${tabId}`
    )
};

export const routeGroup = createGroup(Object.values(createRouter(routeDefs).routes));
