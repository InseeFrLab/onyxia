import { createSelector } from "clean-architecture";
import { State as RootState } from "core/bootstrap";
import { name } from "./state";

const state = (rootState: RootState) => rootState[name];

const main = createSelector(state, state => {
    if (!state.isUserLoggedIn) {
        return { isUserLoggedIn: false as const };
    }

    const { user, isKeycloak } = state;

    return {
        isUserLoggedIn: true as const,
        user,
        isKeycloak
    };
});

export const selectors = {
    main
};
