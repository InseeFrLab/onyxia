import { createUsecaseActions } from "clean-architecture";
import { id, assert } from "tsafe";
import {
    createObjectThatThrowsIfAccessed,
    isObjectThatThrowIfAccessed
} from "clean-architecture";
import { same } from "evt/tools/inDepth/same";
import type { QueryRequest, QueryResponse } from "./decoupledLogic/performQuery";

export const name = "dataExplorer";

export type RouteParams = {
    source?: string;
    rowsPerPage?: number;
    page?: number;
    selectedRow?: number;
    columnVisibility?: Record<string, boolean>;
};

export const ROUTE_PARAMS_DEFAULTS = {
    source: "",
    rowsPerPage: 25,
    page: 1,
    selectedRow: undefined,
    columnVisibility: undefined
} as const satisfies RouteParams & Record<keyof RouteParams, unknown>;

export type State = {
    routeParams: RouteParams;
    ongoingQueryRequest: QueryRequest | undefined;
    completedQuery:
        | {
              request: QueryRequest;
              response: QueryResponse;
          }
        | undefined;
};

export const { actions, reducer } = createUsecaseActions({
    name,
    initialState: createObjectThatThrowsIfAccessed<State>(),
    reducers: {
        routeParamsSet: (
            state,
            {
                payload
            }: {
                payload: {
                    routeParams: RouteParams | undefined;
                };
            }
        ) => {
            const { routeParams } = payload;

            if (isObjectThatThrowIfAccessed(state)) {
                state = id<State>({
                    routeParams: {},
                    ongoingQueryRequest: undefined,
                    completedQuery: undefined
                });
            }

            if (routeParams !== undefined) {
                state.routeParams = routeParams;
            }

            return state;
        },
        urlBarTextUpdated: (state, { payload }: { payload: { urlBarText: string } }) => {
            const { urlBarText } = payload;

            if (state.routeParams.source === urlBarText) {
                return;
            }

            state.routeParams = {
                source: urlBarText,
                columnVisibility: undefined,
                page: undefined,
                rowsPerPage: undefined,
                selectedRow: undefined
            };
        },
        paginationModelUpdated: (
            state,
            {
                payload
            }: {
                payload: {
                    page: number;
                    rowsPerPage: number;
                };
            }
        ) => {
            const { page, rowsPerPage } = payload;

            state.routeParams.page = page;
            state.routeParams.rowsPerPage = rowsPerPage;
            state.routeParams.selectedRow = undefined;
        },
        columnVisibilityUpdated: (
            state,
            { payload }: { payload: { columnVisibility: Record<string, boolean> } }
        ) => {
            const { columnVisibility } = payload;
            state.routeParams.columnVisibility = columnVisibility;
        },
        selectedRowIndexUpdated: (
            state,
            { payload }: { payload: { selectedRowIndex: number | undefined } }
        ) => {
            const { selectedRowIndex } = payload;
            state.routeParams.selectedRow = selectedRowIndex;
        },
        queryStarted: (
            state,
            {
                payload
            }: {
                payload: {
                    queryRequest: QueryRequest;
                };
            }
        ) => {
            const { queryRequest } = payload;
            state.ongoingQueryRequest = queryRequest;
        },
        queryCompleted: (
            state,
            {
                payload
            }: {
                payload: {
                    queryRequest: QueryRequest;
                    queryResponse: QueryResponse;
                };
            }
        ) => {
            const { queryRequest, queryResponse } = payload;

            assert(same(state.ongoingQueryRequest, queryRequest));

            state.completedQuery = {
                request: queryRequest,
                response: queryResponse
            };
            state.ongoingQueryRequest = undefined;
        }
    }
});
