import type { State as RootState } from "core/bootstrap";
import type { State, RouteParams } from "./state";
import { createSelector } from "clean-architecture";
import { name, ROUTE_PARAMS_DEFAULTS } from "./state";
import { objectKeys, id } from "tsafe";
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
            brand: "__queryRequest",
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

export type View = View.NoDataGrid | View.WithDataGrid;

export namespace View {
    export type Common = {
        urlBarText: string;
    };

    export type NoDataGrid = Common & {
        dataGridView: undefined;
        isQuerying: boolean;
    };

    export type WithDataGrid = Common & {
        dataGridView: WithDataGrid.DataGridView;
        isQuerying: false;
    };

    export namespace WithDataGrid {
        export type DataGridView = DataGridView.Errored | DataGridView.NotErrored;

        export namespace DataGridView {
            export type Errored = {
                isErrored: true;
                error: State.Error;
            };

            export type NotErrored = {
                isErrored: false;
                rowsPerPage: number;
                page: number;
                columnVisibility: Record<string, boolean> | undefined;
                rows: any[];
                columns: Column[];
                rowCount: number | undefined;
            };
        }
    }
}

const view = createSelector(
    createSelector(state, state => state.routeParams),
    createSelector(state, queryRequest, (state, queryRequest) => {
        if (state.query === undefined) {
            return null;
        }
        if (state.query.request !== queryRequest) {
            return null;
        }
        return state.query.response;
    }),
    (routeParams, queryResponse): View => {
        const common = id<View.Common>({
            urlBarText: routeParams.source ?? ROUTE_PARAMS_DEFAULTS.source
        });

        if (queryResponse === null || queryResponse === undefined) {
            return id<View.NoDataGrid>({
                ...common,
                dataGridView: undefined,
                isQuerying: queryResponse === undefined
            });
        }

        return id<View.WithDataGrid>({
            ...common,
            dataGridView: queryResponse.isSuccess
                ? id<View.WithDataGrid.DataGridView.NotErrored>({
                      isErrored: false,
                      rowsPerPage:
                          routeParams.rowsPerPage ?? ROUTE_PARAMS_DEFAULTS.rowsPerPage,
                      page: routeParams.page ?? ROUTE_PARAMS_DEFAULTS.page,
                      columnVisibility:
                          routeParams.columnVisibility ??
                          ROUTE_PARAMS_DEFAULTS.columnVisibility,
                      rows: queryResponse.data.rows,
                      columns: queryResponse.data.columns,
                      rowCount: queryResponse.data.rowCount
                  })
                : id<View.WithDataGrid.DataGridView.Errored>({
                      isErrored: true,
                      error: queryResponse.error
                  }),
            isQuerying: false
        });
    }
);

export const selectors = { view };
