import type { State as RootState } from "core/bootstrap";
import { createSelector } from "clean-architecture";
import { name, ROUTE_PARAMS_DEFAULTS, type RouteParams } from "./state";
import { catalogToDatasets } from "./decoupledLogic/jsonld";
import type { QueryRequest, QueryResponse } from "./decoupledLogic/performQuery";
import type { LocalizedString } from "core/ports/OnyxiaApi";

const state = (rootState: RootState) => rootState[name];

const queryRequest = createSelector(
    createSelector(state, state => state.routeParams.source),
    (source): QueryRequest | undefined => {
        if (source === undefined) {
            return undefined;
        }

        try {
            new URL(source);
        } catch {
            return undefined;
        }

        return {
            source
        };
    }
);

export const protectedSelectors = {
    queryRequest,
    routeParams_defaultsAsUndefined: createSelector(
        createSelector(state, state => state.routeParams),
        ({ source }): RouteParams => {
            if (source === ROUTE_PARAMS_DEFAULTS.source) return { source: undefined };

            return { source };
        }
    )
};

export type View = {
    isQuerying: boolean;
    dataCollectionUrl: string;
    catalogView: View.CatalogView | undefined;
};

export namespace View {
    export type CatalogView = CatalogView.Success | CatalogView.Error;

    export namespace CatalogView {
        export type Error = {
            isErrored: true;
            errorCause: QueryResponse.Failed["errorCause"];
            errorMessages: string[];
        };

        export type Success = {
            isErrored: false;
            datasets: Dataset[];
        };

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
}

const catalogView = createSelector(
    createSelector(queryRequest, queryRequest => queryRequest?.source),
    createSelector(state, state => state.completedQuery),
    (queryRequestSource, completedQuery): View.CatalogView | undefined => {
        if (completedQuery === undefined) {
            return undefined;
        }

        if (completedQuery.request.source !== queryRequestSource) {
            return undefined;
        }

        const { response } = completedQuery;

        if (!response.isSuccess) {
            return {
                isErrored: true,
                errorCause: response.errorCause,
                errorMessages: response.errorMessages
            };
        }

        const { framedCatalog } = response;

        const { datasets, parsingErrors } = catalogToDatasets(framedCatalog);

        if (parsingErrors !== undefined) {
            return {
                isErrored: true,
                errorCause: "datasets parsing error",
                errorMessages: parsingErrors
            };
        }

        return { isErrored: false, datasets };
    }
);

const view = createSelector(
    createSelector(
        state,
        state => state.routeParams.source ?? ROUTE_PARAMS_DEFAULTS.source
    ),
    createSelector(state, state => state.ongoingQueryRequest !== undefined),
    catalogView,
    (dataCollectionUrl, isQuerying, catalogView): View => ({
        dataCollectionUrl,
        isQuerying,
        catalogView
    })
);

export const selectors = { view };
