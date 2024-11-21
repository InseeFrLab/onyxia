import { createUsecaseActions } from "clean-architecture";
import { id } from "tsafe/id";

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
    errorMessage: string | undefined;
    data:
        | {
              rows: any[];
              rowCount: number | undefined;
              fileDownloadUrl: string;
          }
        | undefined;
};

export const { actions, reducer } = createUsecaseActions({
    name,
    initialState: id<State>({
        isQuerying: false,
        queryParams: undefined,
        extraRestorableStates: undefined,
        errorMessage: undefined,
        data: undefined
    }),
    reducers: {
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
        extraRestorableStateSet: (
            state,
            {
                payload
            }: { payload: { extraRestorableStates: State["extraRestorableStates"] } }
        ) => {
            const { extraRestorableStates } = payload;
            state.extraRestorableStates = extraRestorableStates;
        },
        querySucceeded: (state, { payload }: { payload: NonNullable<State["data"]> }) => {
            const { rowCount, rows, fileDownloadUrl } = payload;
            state.isQuerying = false;
            state.data = { rowCount, rows, fileDownloadUrl };
        },
        queryFailed: (state, { payload }: { payload: { errorMessage: string } }) => {
            const { errorMessage } = payload;
            state.isQuerying = false;
            state.errorMessage = errorMessage;
            state.queryParams = undefined;
        },
        /** Only for evt */
        restoreStateNeeded: () => {}
    }
});
