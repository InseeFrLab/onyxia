import type { State as RootState } from "core/bootstrap";
import { createSelector } from "clean-architecture";
import { name } from "./state";

const state = (rootState: RootState) => rootState[name];

const configTestResults = createSelector(state, state => state.configTestResults);
const ongoingConfigTests = createSelector(state, state => state.ongoingConfigTests);

export const protectedSelectors = {
    configTestResults,
    ongoingConfigTests
};
