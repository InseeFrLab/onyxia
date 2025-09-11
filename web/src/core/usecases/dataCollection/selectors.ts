import type { State as RootState } from "core/bootstrap";
import { createSelector } from "clean-architecture";
import { name } from "./state";
import { catalogToDatasets } from "./decoupledLogic/jsonld";

const state = (rootState: RootState) => rootState[name];

const main = createSelector(state, state => {
    const { queryParams, errors, isQuerying, framedCatalog } = state;

    if (framedCatalog === undefined) {
        return {
            isQuerying,
            queryParams,
            errors
        };
    }

    const { datasets, parsingErrors } = catalogToDatasets(framedCatalog);

    if (parsingErrors !== undefined) {
        return {
            isQuerying,
            queryParams,
            errors: parsingErrors
        };
    }

    return {
        isQuerying,
        queryParams,
        datasets
    };
});

export const selectors = { main };
