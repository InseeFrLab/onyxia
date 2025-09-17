import { createRouter, defineRoute, param, createGroup } from "type-route";
import { id } from "tsafe/id";
import type { ValueSerializer } from "type-route";

export const routeDefs = {
    dataExplorer: defineRoute(
        {
            source: param.query.optional.string,
            rowsPerPage: param.query.optional.number,
            page: param.query.optional.number,
            selectedRow: param.query.optional.number,
            columnVisibility: param.query.optional.ofType(
                id<ValueSerializer<Record<string, boolean>>>({
                    parse: raw => JSON.parse(raw),
                    stringify: value => JSON.stringify(value)
                })
            )
        },
        () => `/data-explorer`
    )
};

export const routeGroup = createGroup(Object.values(createRouter(routeDefs).routes));
