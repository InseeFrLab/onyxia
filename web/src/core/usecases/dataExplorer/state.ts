import { createUsecaseActions } from "clean-architecture";
import type { Column } from "core/ports/SqlOlap";
import { id, assert, type Equals } from "tsafe";
import type { SupportedFileType } from "./decoupledLogic/SupportedFileType";
import {
    createObjectThatThrowsIfAccessed,
    isObjectThatThrowIfAccessed
} from "clean-architecture";

export const name = "dataExplorer";

export type RouteParams = {
    source: string | undefined;
    rowsPerPage: number | undefined;
    page: number | undefined;
    selectedRow: number | undefined;
    columnVisibility: Record<string, boolean> | undefined;
};

export const ROUTE_PARAMS_DEFAULTS = {
    source: "",
    rowsPerPage: 25,
    page: 1,
    selectedRow: undefined,
    columnVisibility: undefined
} satisfies RouteParams & Record<keyof RouteParams, unknown>;

export type State = {
    routeParams: RouteParams;
    query:
        | {
              request: State.QueryRequest.Brand;
              response: State.QueryResponse | undefined;
          }
        | undefined;
};

export namespace State {
    export type Error =
        | {
              isWellKnown: false;
              message: string;
          }
        | {
              isWellKnown: true;
              reason: "unsupported file type" | "can't fetch file";
          };

    export type QueryRequest = QueryRequest.Brand & {
        source: string;
        rowsPerPage: number;
        page: number;
    };

    export namespace QueryRequest {
        export type Brand = {
            brand: "__queryRequest";
        };
    }

    export type QueryResponse = QueryResponse.Success | QueryResponse.Failed;

    export namespace QueryResponse {
        export type Success = {
            isSuccess: true;
            data: {
                rows: Record<string, unknown>[];
                columns: Column[];
                rowCount: number | undefined;
                sourceUrl: string;
                fileType: SupportedFileType;
                sourceType: "s3" | "http";
            };
        };

        export type Failed = {
            isSuccess: false;
            error: State.Error;
        };
    }
}

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
                    routeParams: {
                        source: undefined,
                        rowsPerPage: undefined,
                        page: undefined,
                        selectedRow: undefined,
                        columnVisibility: undefined
                    },
                    query: undefined
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
        pageUpdated: (
            state,
            {
                payload
            }: {
                payload: {
                    direction: "next" | "previous";
                };
            }
        ) => {
            const { direction } = payload;

            let newPage = state.routeParams.page ?? ROUTE_PARAMS_DEFAULTS.page;

            switch (direction) {
                case "next":
                    newPage++;
                    break;
                case "previous":
                    newPage--;
                    break;
                default:
                    assert<Equals<typeof direction, never>>;
            }

            state.routeParams.page = newPage;
        },
        rowsPerPageUpdated: (
            state,
            { payload }: { payload: { rowsPerPage: number } }
        ) => {
            const { rowsPerPage } = payload;

            state.routeParams.rowsPerPage = rowsPerPage;
        },
        queryResponseSet: (
            state,
            {
                payload
            }: {
                payload: {
                    query: NonNullable<State["query"]>;
                };
            }
        ) => {
            const { query } = payload;
            state.query = query;
        }
    }
});
