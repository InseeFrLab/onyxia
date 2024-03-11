import type { State as RootState } from "core/bootstrap";
import { name } from "./state";
import { createSelector } from "clean-architecture";

const state = (rootState: RootState) => rootState[name];

const secondsLeft = createSelector(state, state => state.secondsLeft);

const main = createSelector(secondsLeft, secondsLeft => ({ secondsLeft }));

export const selectors = { main };

export const privateSelectors = { secondsLeft };
