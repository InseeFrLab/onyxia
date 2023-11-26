import type { State as RootState } from "core/bootstrap";
import { createSelector } from "redux-clean-architecture";
import { name } from "./state";

const state = (rootState: RootState) => rootState[name];

const main = createSelector(state, state => {
    const { isQuerying, errorMessage, data } = state;

    return { isQuerying, errorMessage, data };
});

export const selectors = { main };
