import type { State as RootState } from "core/bootstrap";
import { createSelector } from "clean-architecture";
import { name } from "./state";
import { catalogToDatasets } from "./decoupledLogic/jsonld";

const state = (rootState: RootState) => rootState[name];

const main = createSelector(state, state => {
    const { queryParams, error, isQuerying, rawCatalog, framedCatalog } = state;

    if (rawCatalog === undefined) {
        return {
            isQuerying,
            queryParams,
            error
        };
    }

    const { datasets, parsingError } = catalogToDatasets(framedCatalog);

    return {
        isQuerying,
        queryParams,
        error,
        datasets,
        parsingError,
        rawCatalog
    };
});

export const selectors = { main };
