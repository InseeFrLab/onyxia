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
} satisfies RouteParams;

export type State = {
    routeParams: RouteParams;
    query:
        | {
              request: State.QueryRequest;
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

    export type QueryRequest = {
        source: string;
        rowsPerPage: number;
        page: number;
    };

    export type QueryResponse = QueryResponse.Success | QueryResponse.Failed;

    export namespace QueryResponse {
        export type Success = {
            isSuccess: true;
            data: {
                rows: any[];
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
                    query: undefined,
                    urlBarCurrentText: ""
                });
            }

            if (routeParams !== undefined) {
                state.routeParams = routeParams;
            }

            return state;
        },
        urlBarTextUpdated: (state, { payload }: { payload: { urlBarText: string } }) => {
            const { urlBarText } = payload;

            state.routeParams.source = urlBarText;
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
