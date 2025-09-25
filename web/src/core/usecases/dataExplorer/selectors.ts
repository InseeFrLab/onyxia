import type { State as RootState } from "core/bootstrap";
import type { State, RouteParams } from "./state";
import { createSelector } from "clean-architecture";
import { name, ROUTE_PARAMS_DEFAULTS } from "./state";
import { objectEntries, objectFromEntries } from "tsafe";
import type { Column } from "core/ports/SqlOlap";

const state = (rootState: RootState) => rootState[name];

const queryRequest = createSelector(
    createSelector(state, state => state.routeParams.source),
    createSelector(state, state => state.routeParams.page),
    createSelector(state, state => state.routeParams.rowsPerPage),
    (source, page, rowPerPage): State.QueryRequest | undefined => {
        if (source === undefined) {
            return undefined;
        }

        try {
            new URL(source);
        } catch {
            return undefined;
        }

        return {
            source,
            page: page ?? ROUTE_PARAMS_DEFAULTS.page,
            rowsPerPage: rowPerPage ?? ROUTE_PARAMS_DEFAULTS.rowsPerPage
        };
    }
);

export const protectedSelectors = {
    queryRequest,
    routeParams_defaultsAsUndefined: createSelector(
        createSelector(state, state => state.routeParams),
        (routeParams): RouteParams => {
            return objectFromEntries(
                objectEntries(ROUTE_PARAMS_DEFAULTS).map(([key, defaultValue]) => [
                    key,
                    (() => {
                        const value = routeParams[key];
                        return defaultValue === value ? undefined : value;
                    })()
                ])
            );
        }
    )
};

export type View = View.NoData | View.WithData;

export namespace View {
    type Common = {
        urlBarText: string;
    };

    export type NoData = Common & {
        isQuerying: boolean;
        rowsPerPage?: never;
        page?: never;
        data?: never;
    };

    export type WithData = Common & {
        isQuerying: false;
        rowsPerPage: number;
        page: number;
        columnVisibility: Record<string, boolean> | undefined;
        data: {
            rows: any[];
            columns: Column[];
            rowCount: number | undefined;
        };
    };
}

const view = createSelector();

export const selectors = {};
