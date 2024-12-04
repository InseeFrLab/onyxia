import { createRouter, defineRoute, param, createGroup, type Route } from "type-route";
import { id } from "tsafe/id";
import type { ValueSerializer } from "type-route";

export const DEFAULT_QUERY_PARAMS = {
    source: "",
    rowsPerPage: 25,
    page: 1,
    selectedRow: undefined,
    columnVisibility: {}
};
export const routeDefs = {
    dataExplorer: defineRoute(
        {
            source: param.query.optional.string,
            rowsPerPage: param.query.optional.number.default(
                DEFAULT_QUERY_PARAMS.rowsPerPage
            ),
            page: param.query.optional.number.default(DEFAULT_QUERY_PARAMS.page),
            selectedRow: param.query.optional.number,
            columnVisibility: param.query.optional
                .ofType(
                    id<ValueSerializer<Record<string, boolean>>>({
                        parse: raw => JSON.parse(raw),
                        stringify: value => JSON.stringify(value)
                    })
                )
                .default(DEFAULT_QUERY_PARAMS.columnVisibility)
        },
        () => `/data-explorer`
    )
};

export const routeGroup = createGroup(Object.values(createRouter(routeDefs).routes));

export type PageRoute = Route<typeof routeGroup>;

export const getDoRequireUserLoggedIn: (route: PageRoute) => boolean = () => false;
