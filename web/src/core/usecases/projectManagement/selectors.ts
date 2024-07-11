import type { State as RootState } from "core/bootstrap";
import type { Project } from "core/ports/OnyxiaApi";
import { name } from "./state";
import { createSelector } from "clean-architecture";
import { assert } from "tsafe/assert";

const state = (rootState: RootState) => rootState[name];

const projectConfig = createSelector(state, state => state.currentProjectConfigs);

export const protectedSelectors = {
    "project": createSelector(state, (state): Project => {
        const { projects, selectedProjectId } = state;

        const project = projects.find(({ id }) => id === selectedProjectId);

        assert(project !== undefined);

        return project;
    }),
    projectConfig
};

export const selectors = {
    "projectSelect": createSelector(
        createSelector(state, state => state.projects),
        createSelector(state, state => state.selectedProjectId),
        (projects, selectedProjectId) => ({
            "options": projects.map(({ id, name }) => ({ value: id, label: name })),
            "selectedOptionValue": selectedProjectId
        })
    ),
    "servicePassword": createSelector(
        projectConfig,
        projectConfig => projectConfig.servicePassword
    )
};
