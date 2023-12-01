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
        "errorMessage": undefined,
        "data": undefined
    }),
    "reducers": {
        "queryStarted": (
            state,
            { payload }: { payload: { queryParams: NonNullable<State["queryParams"]> } }
        ) => {
            const { queryParams } = payload;
            state.errorMessage = undefined;
            state.isQuerying = true;
            state.queryParams = queryParams;
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
        }
    }
});
