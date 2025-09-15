import type { State as RootState } from "core/bootstrap";
import { createSelector } from "clean-architecture";
import { name } from "./state";

const state = (rootState: RootState) => rootState[name];

const main = createSelector(state, state => {
    const { queryParams, error, isQuerying, datasets } = state;

    return {
        isQuerying,
        queryParams,
        error,
        datasets
    };
});

export const selectors = { main };
