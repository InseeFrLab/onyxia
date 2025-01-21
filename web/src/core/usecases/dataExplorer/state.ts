import { createUsecaseActions } from "clean-architecture";
import type { Column } from "core/ports/SqlOlap";
import { assert } from "tsafe/assert";
import { id } from "tsafe/id";
import type { SupportedFileType } from "./decoupledLogic/SupportedFileType";

export const name = "dataExplorer";

export type State = {
    isQuerying: boolean;
    queryParams:
        | {
              sourceUrl: string;
              rowsPerPage: number;
              page: number;
          }
        | undefined;
    extraRestorableStates:
        | {
              selectedRowIndex: number | undefined;
              columnVisibility: Record<string, boolean>;
          }
        | undefined;
    error: State.Error | undefined;
    data:
        | {
              rows: any[];
              columns: Column[];
              rowCount: number | undefined;
              fileDownloadUrl: string;
              fileType: SupportedFileType;
          }
        | undefined;
};

namespace State {
    export type Error =
        | {
              isWellKnown: false;
              message: string;
          }
        | {
              isWellKnown: true;
              kind: "unsupported file type";
          };
}

export const { actions, reducer } = createUsecaseActions({
    name,
    initialState: id<State>({
        isQuerying: false,
        queryParams: undefined,
        extraRestorableStates: undefined,
        error: undefined,
        data: undefined
    }),
    reducers: {
        extraRestorableStateSet: (
            state,
            {
                payload
            }: { payload: { extraRestorableStates: State["extraRestorableStates"] } }
        ) => {
            const { extraRestorableStates } = payload;
            state.extraRestorableStates = extraRestorableStates;
        },
        selectedRowIndexSet: (
            state,
            {
                payload
            }: {
                payload: {
                    selectedRowIndex: NonNullable<
                        State["extraRestorableStates"]
                    >["selectedRowIndex"];
                };
            }
        ) => {
            const { selectedRowIndex } = payload;
            assert(state.extraRestorableStates !== undefined);
            state.extraRestorableStates.selectedRowIndex = selectedRowIndex;
        },
        columnVisibilitySet: (
            state,
            {
                payload
            }: {
                payload: {
                    columnVisibility: NonNullable<
                        State["extraRestorableStates"]
                    >["columnVisibility"];
                };
            }
        ) => {
            const { columnVisibility } = payload;
            assert(state.extraRestorableStates !== undefined);
            state.extraRestorableStates.columnVisibility = columnVisibility;
        },
        queryStarted: (
            state,
            {
                payload
            }: {
                payload: {
                    queryParams: NonNullable<State["queryParams"]>;
                };
            }
        ) => {
            const { queryParams } = payload;
            state.error = undefined;
            state.isQuerying = true;
            state.queryParams = queryParams;
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
                    fileDownloadUrl: string;
                    fileType: SupportedFileType;
                };
            }
        ) => {
            const { rowCount, rows, fileDownloadUrl, columns, fileType } = payload;
            state.isQuerying = false;
            state.data = {
                rowCount,
                rows,
                columns,
                fileDownloadUrl,
                fileType
            };
            state.extraRestorableStates = {
                selectedRowIndex: undefined,
                columnVisibility: {}
            };
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
