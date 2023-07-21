import { assert } from "tsafe/assert";
import type { Thunks } from "../core";
import type { Project } from "../ports/OnyxiaApi";
import { createSlice } from "@reduxjs/toolkit";
import { thunks as userConfigsThunks } from "./userConfigs";
import type { PayloadAction } from "@reduxjs/toolkit";
import { createObjectThatThrowsIfAccessed } from "redux-clean-architecture";
import type { State as RootState } from "../core";

type State = {
    projects: Project[];
    selectedProjectId: string;
    isOnboarding: boolean;
};

export const name = "projectSelection";

export const { reducer, actions } = createSlice({
    name,
    "initialState": createObjectThatThrowsIfAccessed<State>(),
    "reducers": {
        "initialize": (_, { payload }: PayloadAction<State>) => payload,
        "projectChanged": (state, { payload }: PayloadAction<{ projectId: string }>) => {
            const { projectId } = payload;

            state.selectedProjectId = projectId;
        },
        "onboardingStarted": state => {
            state.isOnboarding = true;
        },
        "onboardingCompleted": state => {
            state.isOnboarding = false;
        }
    }
});

export const thunks = {
    "changeProject":
        (params: {
            projectId: string;
            /** Default false, only use if we reload just after */
            doPreventDispatch?: boolean;
        }) =>
        async (...args) => {
            const [dispatch] = args;

            const { projectId, doPreventDispatch = false } = params;

            await dispatch(
                userConfigsThunks.changeValue({
                    "key": "selectedProjectId",
                    "value": projectId
                })
            );

            if (doPreventDispatch) {
                return;
            }

            dispatch(actions.projectChanged({ projectId }));

            await dispatch(internalThunks.onboard());
        }
} satisfies Thunks;

export const privateThunks = {
    "initialize":
        () =>
        async (...args) => {
            const [dispatch, getState, { onyxiaApi }] = args;

            const projects = await onyxiaApi.getUserProjects();

            let selectedProjectId = getState().userConfigs.selectedProjectId.value;

            if (
                selectedProjectId === null ||
                !projects.map(({ id }) => id).includes(selectedProjectId)
            ) {
                selectedProjectId = projects[0].id;

                await dispatch(
                    userConfigsThunks.changeValue({
                        "key": "selectedProjectId",
                        "value": selectedProjectId
                    })
                );
            }

            dispatch(
                actions.initialize({
                    projects,
                    selectedProjectId,
                    "isOnboarding": false
                })
            );

            // refGetCurrentlySelectedProjectId is set  after this function completes
            setTimeout(() => {
                dispatch(internalThunks.onboard());
            }, 0);
        }
} satisfies Thunks;

const internalThunks = {
    "onboard":
        () =>
        async (...args) => {
            const [dispatch, , { onyxiaApi }] = args;
            dispatch(actions.onboardingStarted());
            await onyxiaApi.onboard();
            dispatch(actions.onboardingCompleted());
        }
} satisfies Thunks;

export const selectors = (() => {
    const selectedProject = (rootState: RootState): Project => {
        const state = rootState[name];
        const { projects, selectedProjectId } = state;

        const selectedProject = projects.find(({ id }) => id === selectedProjectId);

        assert(selectedProject !== undefined);

        return selectedProject;
    };

    return { selectedProject };
})();
