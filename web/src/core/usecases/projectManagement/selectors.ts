import type { State as RootState } from "core/bootstrap";
import type { Project } from "core/ports/OnyxiaApi";
import { name } from "./state";
import { createSelector } from "redux-clean-architecture";
import { assert } from "tsafe/assert";

const state = (rootState: RootState) => rootState[name];

const currentProjectConfigs = createSelector(state, state => state.currentProjectConfigs);

const currentProject = createSelector(state, (state): Project => {
    const { projects, selectedProjectId } = state;

    const project = projects.find(({ id }) => id === selectedProjectId);

    assert(project !== undefined);

    return project;
});

const availableProjects = createSelector(state, state =>
    state.projects.map(({ id, name }) => ({ id, name }))
);

export const selectors = { availableProjects, currentProject, currentProjectConfigs };
