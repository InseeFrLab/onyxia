import { createUsecaseActions } from "clean-architecture";
import { id } from "tsafe/id";
import type { LocalizedString } from "ui/i18n";
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
    error: string | undefined;
    datasets: State.Dataset[] | undefined;
};

export namespace State {
    export type Dataset = {
        id: string;
        title: LocalizedString;
        description: LocalizedString | undefined;
        keywords: LocalizedString[] | undefined;
        issuedDate: string | undefined;
        landingPageUrl: string | undefined;
        licenseUrl: string | undefined;
        distributions: Distribution[];
    };

    export type Distribution = {
        id: string;
        format: string | undefined;
        downloadUrl: string | undefined;
        accessUrl: string | undefined;
        sizeInBytes?: number;
    };
}

export const { actions, reducer } = createUsecaseActions({
    name,
    initialState: id<State>({
        isQuerying: false,
        queryParams: undefined,
        error: undefined,
        datasets: undefined
    }),
    reducers: {
        restoreState: state => {
            state.isQuerying = false;
            state.error = undefined;
            state.queryParams = undefined;
            state.datasets = undefined;
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
                    datasets: State.Dataset[];
                };
            }
        ) => {
            const { datasets } = payload;
            state.isQuerying = false;
            state.datasets = datasets;
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
