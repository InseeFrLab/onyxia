import type { State as RootState } from "core/bootstrap";
import { name } from "./state";
import { createSelector } from "clean-architecture";
import { assert } from "tsafe/assert";

const state = (rootState: RootState) => rootState[name];

const projectConfig = createSelector(state, state => state.currentProjectConfigs);

export const protectedSelectors = {
    currentProject: createSelector(state, state => {
        const { projects, selectedProjectId } = state;

        const project = projects.find(({ id }) => id === selectedProjectId);

        assert(project !== undefined);

        return project;
    }),
    projectConfig
};

export const selectors = {
    projectSelect: createSelector(
        createSelector(state, state => state.projects),
        createSelector(state, state => state.selectedProjectId),
        (projects, selectedProjectId) => ({
            options: projects.map(({ id, name }) => ({ value: id, label: name })),
            selectedOptionValue: selectedProjectId
        })
    ),
    servicePassword: createSelector(
        projectConfig,
        projectConfig => projectConfig.servicePassword
    ),
    groupProjectName: createSelector(
        protectedSelectors.currentProject,
        currentProject => {
            if (currentProject.group == undefined) {
                return undefined;
            }
            return currentProject.name;
        }
    ),
    doesUserBelongToSomeGroupProject: createSelector(
        state,
        state => state.projects.length !== 1
    ),
    canInjectPersonalInfos: createSelector(
        protectedSelectors.currentProject,
        currentProject => {
            return currentProject.doInjectPersonalInfos;
        }
    )
};
