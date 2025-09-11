import type { State as RootState } from "core/bootstrap";
import { createSelector } from "clean-architecture";
import { name } from "./state";
import { catalogToDatasets } from "./decoupledLogic/jsonld";

const state = (rootState: RootState) => rootState[name];

const datasets = createSelector(
    createSelector(state, state => state.rawCatalog),
    rawCatalog => {
        if (rawCatalog === undefined) {
            return undefined;
        }

        const data = catalogToDatasets(rawCatalog);
        return data;
    }
);
const main = createSelector(state, datasets, (state, datasets) => {
    const { queryParams, error, isQuerying } = state;

    return {
        isQuerying,
        queryParams,
        error,
        datasets
    };
});

export const selectors = { main, datasets };
