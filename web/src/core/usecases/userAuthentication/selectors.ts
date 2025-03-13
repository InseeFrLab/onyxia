import { createSelector } from "clean-architecture";
import { State as RootState } from "core/bootstrap";
import { name } from "./state";
import { assert } from "tsafe/assert";

const state = (rootState: RootState) => rootState[name];

const main = createSelector(state, state => {
    if (!state.isUserLoggedIn) {
        return { isUserLoggedIn: false as const };
    }

    const { user, providerSpecific } = state;

    return {
        isUserLoggedIn: true as const,
        user,
        providerSpecific
    };
});

/** User must be logged in to use this selector */
const isKeycloak = createSelector(state, state => {
    assert(state.isUserLoggedIn);

    return state.providerSpecific.type === "keycloak";
});

export const selectors = {
    main
};

export const protectedSelectors = {
    isKeycloak
};
