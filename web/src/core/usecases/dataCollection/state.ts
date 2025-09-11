import { createUsecaseActions } from "clean-architecture";
import { id } from "tsafe/id";
import type { JsonLdDocument } from "jsonld";
export const name = "dataCollection" as const;

export type State = {
    isQuerying: boolean;
    queryParams:
        | {
              sourceUrl: string;
              rowsPerPage: number | undefined;
              page: number | undefined;
          }
        | undefined;
    rawCatalog: JsonLdDocument | undefined;
    error: string | undefined;
};

export const { actions, reducer } = createUsecaseActions({
    name,
    initialState: id<State>({
        isQuerying: false,
        queryParams: undefined,
        rawCatalog: undefined,
        error: undefined
    }),
    reducers: {
        restoreState: state => {
            state.isQuerying = false;
            state.rawCatalog = undefined;
            state.error = undefined;
            state.queryParams = undefined;
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
            state.queryParams = queryParams;
            state.error = undefined;
            state.isQuerying = true;
        },

        querySucceeded: (
            state,
            {
                payload
            }: {
                payload: {
                    rawCatalog: JsonLdDocument;
                };
            }
        ) => {
            const { rawCatalog } = payload;
            state.isQuerying = false;
            state.rawCatalog = rawCatalog;
        },
        queryFailed: (state, { payload }: { payload: { error: string } }) => {
            const { error } = payload;
            state.isQuerying = false;
            state.error = error;
        },
        queryCanceled: state => {
            state.isQuerying = false;
            state.queryParams = undefined;
        },

        paginationChanged: (
            state,
            {
                payload
            }: {
                payload: {
                    page: number | undefined;
                    rowsPerPage: number | undefined;
                };
            }
        ) => {
            if (state.queryParams === undefined) return;

            state.queryParams.page = payload.page;
            state.queryParams.rowsPerPage = payload.rowsPerPage;
        }
    }
});
