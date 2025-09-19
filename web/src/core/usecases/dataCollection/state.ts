import { createUsecaseActions } from "clean-architecture";
import type { LocalizedString } from "core/ports/OnyxiaApi";
import type { JsonLdDocument } from "jsonld";
import { id } from "tsafe/id";
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
    errors: string[] | undefined;
    framedCatalog: JsonLdDocument | undefined;
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
        errors: undefined,
        framedCatalog: undefined
    }),
    reducers: {
        restoreState: state => {
            state.isQuerying = false;
            state.errors = undefined;
            state.queryParams = undefined;
            state.framedCatalog = undefined;
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
            state.errors = undefined;
            state.isQuerying = true;
        },

        querySucceeded: (
            state,
            {
                payload
            }: {
                payload: {
                    framedCatalog: JsonLdDocument;
                };
            }
        ) => {
            const { framedCatalog } = payload;
            state.isQuerying = false;
            state.framedCatalog = framedCatalog;
        },
        queryFailed: (state, { payload }: { payload: { errors: string[] } }) => {
            const { errors } = payload;
            state.isQuerying = false;
            state.errors = errors;
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
