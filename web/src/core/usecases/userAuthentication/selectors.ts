import { createSelector } from "redux-clean-architecture";
import { State as RootState } from "core/bootstrap";
import { name } from "./state";
import { assert } from "tsafe/assert";

const state = (rootState: RootState) => rootState[name];

const isUserLoggedIn = createSelector(state, state => state.isUserLoggedIn);

const user = createSelector(state, state => {
    assert(state.isUserLoggedIn);

    return state.user;
});

export const selectors = {
    isUserLoggedIn,
    user
};
