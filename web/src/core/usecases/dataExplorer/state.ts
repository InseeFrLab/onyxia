import { createUsecaseActions } from "clean-architecture";
import type { Column } from "core/ports/SqlOlap";
import { assert } from "tsafe/assert";
import { id } from "tsafe/id";

export const name = "dataExplorer";

export type State = {
    isQuerying: boolean;
    params:
        | {
              queryParams: {
                  sourceUrl: string;
                  rowsPerPage: number;
                  page: number;
              };
              extraRestorableStates: {
                  selectedRowIndex: number | undefined;
                  columnVisibility: Record<string, boolean>;
              };
          }
        | undefined;
    result:
        | {
              isErrored: false;
              data:
                  | {
                        rows: any[];
                        columns: Column[];
                        rowCount: number | undefined;
                    }
                  | undefined;
          }
        | {
              isErrored: true;
              error: State.Error;
          };
};

namespace State {
    export type Error =
        | {
              isWellKnown: false;
              message: string;
          }
        | {
              isWellKnown: true;
              reason: "unsupported file type" | "can't fetch file";
          };
}

export const { actions, reducer } = createUsecaseActions({
    name,
    initialState: id<State>({
        isQuerying: false,
        params: undefined,
        result: { isErrored: false, data: undefined }
    }),
    reducers: {
        queryStarted: (
            state,
            {
                payload
            }: {
                payload: {
                    params: NonNullable<State["params"]>;
                };
            }
        ) => {
            const { params } = payload;

            state.params = params;
            state.result = {
                isErrored: false,
                // TODO: Here be more precise
                data: undefined
            };
        },
        querySucceeded: (
            state,
            {
                payload
            }: {
                payload: {
                    rows: any[];
                    columns: Column[];
                    rowCount: number | undefined;
                    extraRestorableStates:
                        | {
                              selectedRowIndex: number | undefined;
                              columnVisibility: Record<string, boolean>;
                          }
                        | undefined;
                };
            }
        ) => {
            const { rowCount, rows, columns, extraRestorableStates } = payload;
            state.isQuerying = false;
            state.data = {
                rowCount,
                rows,
                columns
            };
            state.extraRestorableStates = extraRestorableStates;
        },
        queryCanceled: state => {
            state.isQuerying = false;
            state.queryParams = undefined;
        },
        queryFailed: (state, { payload }: { payload: { error: State.Error } }) => {
            const { error } = payload;
            state.isQuerying = false;
            state.error = error;
        },
        restoreState: state => {
            state.queryParams = undefined;
            state.extraRestorableStates = undefined;
            state.data = undefined;
            state.error = undefined;
        }
    }
});
