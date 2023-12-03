import { createUsecaseActions } from "redux-clean-architecture";
import { id } from "tsafe/id";

export const name = "dataExplorer";

type State = {
    isQuerying: boolean;
    queryParams:
        | {
              sourceUrl: string;
              rowsPerPage: number;
              page: number;
          }
        | undefined;
    selectedRowIndex: number | undefined;
    errorMessage: string | undefined;
    data:
        | {
              rows: any[];
              rowCount: number | undefined;
          }
        | undefined;
};

export const { actions, reducer } = createUsecaseActions({
    name,
    "initialState": id<State>({
        "isQuerying": false,
        "queryParams": undefined,
        "selectedRowIndex": undefined,
        "errorMessage": undefined,
        "data": undefined
    }),
    "reducers": {
        "queryStarted": (
            state,
            {
                payload
            }: {
                payload: {
                    queryParams: NonNullable<State["queryParams"]>;
                    selectedRowIndex: number | undefined;
                };
            }
        ) => {
            const { queryParams, selectedRowIndex } = payload;
            state.errorMessage = undefined;
            state.isQuerying = true;
            state.queryParams = queryParams;
            state.selectedRowIndex = selectedRowIndex;
        },
        "rowSelectionChanged": (
            state,
            { payload }: { payload: { selectedRowIndex: number | undefined } }
        ) => {
            const { selectedRowIndex } = payload;
            state.selectedRowIndex = selectedRowIndex;
        },
        "querySucceeded": (
            state,
            { payload }: { payload: { rows: any[]; rowCount: number | undefined } }
        ) => {
            const { rowCount, rows } = payload;
            state.isQuerying = false;
            state.data = { rowCount, rows };
        },
        "queryFailed": (state, { payload }: { payload: { errorMessage: string } }) => {
            const { errorMessage } = payload;
            state.isQuerying = false;
            state.errorMessage = errorMessage;
        },
        /** Only for evt */
        "restoreStateNeeded": () => {}
    }
});
