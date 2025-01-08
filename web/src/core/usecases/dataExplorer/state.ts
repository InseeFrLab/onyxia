import { createUsecaseActions } from "clean-architecture";
import { assert } from "tsafe/assert";
import { id } from "tsafe/id";

export const name = "dataExplorer";

export type State = {
    isQuerying: boolean;
    queryParams:
        | {
              sourceUrl: string;
              rowsPerPage: number | undefined;
              page: number | undefined;
          }
        | undefined;
    extraRestorableStates:
        | {
              selectedRowIndex: number | undefined;
              columnVisibility: Record<string, boolean>;
          }
        | undefined;
    errorMessage: string | undefined;
    data:
        | {
              state: "loaded";
              rows: any[];
              columns: { name: string; type: string }[];
              rowCount: number | undefined;
              fileDownloadUrl: string;
              fileType: "parquet" | "csv" | "json";
          }
        | { state: "empty" };
};

export const { actions, reducer } = createUsecaseActions({
    name,
    initialState: id<State>({
        isQuerying: false,
        queryParams: undefined,
        extraRestorableStates: undefined,
        errorMessage: undefined,
        data: { state: "empty" }
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
            state.errorMessage = undefined;
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
                    columns: { name: string; type: string }[];
                    rowCount: number | undefined;
                    fileDownloadUrl: string;
                    fileType: "parquet" | "csv" | "json";
                };
            }
        ) => {
            const { rowCount, rows, fileDownloadUrl, columns, fileType } = payload;
            state.isQuerying = false;
            state.data = {
                state: "loaded",
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
        queryFailed: (state, { payload }: { payload: { errorMessage: string } }) => {
            const { errorMessage } = payload;
            state.isQuerying = false;
            state.errorMessage = errorMessage;
        },
        restoreState: state => {
            state.queryParams = undefined;
            state.extraRestorableStates = undefined;
            state.data = { state: "empty" };
            state.errorMessage = undefined;
        }
    }
});
