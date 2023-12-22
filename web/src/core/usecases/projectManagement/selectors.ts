import type { State as RootState } from "core/bootstrap";
import type { Project } from "core/ports/OnyxiaApi";
import { name } from "./state";
import { createSelector } from "redux-clean-architecture";
import { assert } from "tsafe/assert";

const state = (rootState: RootState) => rootState[name];

const selectedProjectConfigs = createSelector(
    state,
    state => state.selectedProjectConfigs
);

const currentProject = createSelector(state, (state): Project => {
    const { projects, selectedProjectId } = state;

    const project = projects.find(({ id }) => id === selectedProjectId);

    assert(project !== undefined);

    return project;
});

//export const privateSelectors = { dirPath };
export const selectors = { currentProject, selectedProjectConfigs };
