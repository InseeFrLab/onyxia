import type { State as RootState } from "core/bootstrap";
import type { RouteParams } from "./state";
import { createSelector } from "clean-architecture";
import { name, ROUTE_PARAMS_DEFAULTS } from "./state";
import { objectKeys, id } from "tsafe";
import type { SqlOlap } from "core/ports/SqlOlap";
import type { QueryRequest, QueryResponse } from "./decoupledLogic/performQuery";

const state = (rootState: RootState) => rootState[name];

const queryRequest = createSelector(
    createSelector(state, state => state.routeParams.source),
    createSelector(state, state => state.routeParams.page),
    createSelector(state, state => state.routeParams.rowsPerPage),
    (source, page, rowPerPage): QueryRequest | undefined => {
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
            const routeParams_defaultsAsUndefined = { ...routeParams };

            for (const key of objectKeys(ROUTE_PARAMS_DEFAULTS)) {
                const value = routeParams[key];
                const value_default = ROUTE_PARAMS_DEFAULTS[key];
                if (value === value_default) {
                    routeParams_defaultsAsUndefined[key] = undefined;
                }
            }

            return routeParams_defaultsAsUndefined;
        }
    )
};

export type View = {
    urlBarText: string;
    isQuerying: boolean;
    dataGridView: View.DataGridView | undefined;
};

export namespace View {
    export type DataGridView = DataGridView.Errored | DataGridView.NotErrored;

    export namespace DataGridView {
        export type Errored = {
            isErrored: true;
            errorCause: QueryResponse.Failed["errorCause"];
        };

        export type NotErrored = {
            isErrored: false;
            rowsPerPage: number;
            page: number;
            columnVisibility: Record<string, boolean> | undefined;
            rows: Record<string, unknown>[];
            rowIdByRowIndex: Record<number, string>;
            columns: SqlOlap.ReturnTypeOfGetRows.Success.Column[];
            rowCount: number | undefined;
            selectedRowId: number | undefined;
        };
    }
}

const dataGridView = createSelector(
    createSelector(queryRequest, queryRequest => queryRequest?.source),
    createSelector(state, state => state.completedQuery),
    createSelector(
        state,
        state =>
            state.routeParams.columnVisibility ?? ROUTE_PARAMS_DEFAULTS.columnVisibility
    ),
    createSelector(
        state,
        state => state.routeParams.selectedRow ?? ROUTE_PARAMS_DEFAULTS.selectedRow
    ),
    (
        queryRequestSource,
        completedQuery,
        columnVisibility,
        selectedRow
    ): View.DataGridView | undefined => {
        if (completedQuery === undefined) {
            return undefined;
        }

        if (completedQuery.request.source !== queryRequestSource) {
            return undefined;
        }

        const { request, response } = completedQuery;

        if (!response.isSuccess) {
            return id<View.DataGridView.Errored>({
                isErrored: true,
                errorCause: response.errorCause
            });
        }

        const rowsPerPage = request.rowsPerPage;
        const page = request.page;

        return id<View.DataGridView.NotErrored>({
            isErrored: false,
            rowsPerPage,
            page: request.page,
            columnVisibility,
            rows: response.data.rows,
            rowIdByRowIndex: Object.fromEntries(
                response.data.rows.map((_, i) => [i, `${i + rowsPerPage * (page - 1)}`])
            ),
            columns: response.data.columns,
            rowCount: response.data.rowCount,
            selectedRowId: selectedRow
        });
    }
);

const view = createSelector(
    createSelector(
        state,
        state => state.routeParams.source ?? ROUTE_PARAMS_DEFAULTS.source
    ),
    createSelector(state, state => state.ongoingQueryRequest !== undefined),
    dataGridView,
    (urlBarText, isQuerying, dataGridView): View => ({
        urlBarText,
        isQuerying,
        dataGridView
    })
);

export const selectors = { view };
