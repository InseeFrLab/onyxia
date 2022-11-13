import { assert } from "tsafe/assert";
import type { ThunkAction } from "../setup";
import type { Project } from "../ports/OnyxiaApiClient";
import { createSlice } from "@reduxjs/toolkit";
import { thunks as userConfigsThunks } from "./userConfigs";
import type { PayloadAction } from "@reduxjs/toolkit";
import { createObjectThatThrowsIfAccessed } from "redux-clean-architecture";
import type { State } from "../setup";

type ProjectsState = {
    projects: Project[];
    selectedProjectId: string;
};

export const name = "projectSelection";

export const { reducer, actions } = createSlice({
    name,
    "initialState": createObjectThatThrowsIfAccessed<ProjectsState>(),
    "reducers": {
        "initialize": (_, { payload }: PayloadAction<ProjectsState>) => payload,
        "projectChanged": (state, { payload }: PayloadAction<{ projectId: string }>) => {
            const { projectId } = payload;

            state.selectedProjectId = projectId;
        },
    },
});

export const thunks = {
    "changeProject":
        (params: {
            projectId: string;
            /** Default false, only use if we reload just after */
            doPreventDispatch?: boolean;
        }): ThunkAction =>
        async (...args) => {
            const [dispatch] = args;

            const { projectId, doPreventDispatch = false } = params;

            await dispatch(
                userConfigsThunks.changeValue({
                    "key": "selectedProjectId",
                    "value": projectId,
                }),
            );

            if (doPreventDispatch) {
                return;
            }

            dispatch(actions.projectChanged({ projectId }));
        },
};

export const privateThunks = {
    "initialize":
        (): ThunkAction =>
        async (...args) => {
            const [dispatch, getState, { onyxiaApiClient }] = args;

            const projects = await onyxiaApiClient.getUserProjects();

            let selectedProjectId = getState().userConfigs.selectedProjectId.value;

            if (
                selectedProjectId === null ||
                !projects.map(({ id }) => id).includes(selectedProjectId)
            ) {
                selectedProjectId = projects[0].id;

                await dispatch(
                    userConfigsThunks.changeValue({
                        "key": "selectedProjectId",
                        "value": selectedProjectId,
                    }),
                );
            }

            dispatch(
                actions.initialize({
                    projects,
                    selectedProjectId,
                }),
            );
        },
};

export const selectors = (() => {
    const selectedProject = (rootState: State): Project => {
        const { projects, selectedProjectId } = rootState.projectSelection;

        const selectedProject = projects.find(({ id }) => id === selectedProjectId);

        assert(selectedProject !== undefined);

        return selectedProject;
    };

    return { selectedProject };
})();
