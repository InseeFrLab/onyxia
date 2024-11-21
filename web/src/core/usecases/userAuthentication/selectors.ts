import { createSelector } from "clean-architecture";
import { State as RootState } from "core/bootstrap";
import { name } from "./state";
import { assert } from "tsafe/assert";

const state = (rootState: RootState) => rootState[name];

/** To use only when we know the user is authenticated */
const user = createSelector(state, state => {
    assert(state.isUserLoggedIn);

    return state.user;
});

const authenticationState = createSelector(state, state => {
    if (!state.isUserLoggedIn) {
        return {
            isUserLoggedIn: false as const
        };
    }

    return {
        isUserLoggedIn: true as const,
        user: state.user
    };
});

export const selectors = {
    authenticationState,
    user
};
