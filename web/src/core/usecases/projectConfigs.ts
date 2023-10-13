import { assert } from "tsafe/assert";
import type { Thunks } from "../core";
import type { Project } from "../ports/OnyxiaApi";
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { createObjectThatThrowsIfAccessed } from "redux-clean-architecture";
import type { State as RootState, CreateEvt } from "../core";
import * as userConfigs from "./userConfigs";
import { hiddenDirectoryBasename } from "./userConfigs";
import { join as pathJoin } from "path";
import type { Id } from "tsafe/id";
import { generateRandomPassword } from "core/tools/generateRandomPassword";

type State = {
    projects: Project[];
    selectedProjectId: string;
    isOnboarding: boolean;
};

export type ProjectConfigs = Id<
    Record<string, string | boolean | number | null>,
    {
        servicePassword: string;
        isOnboarded: boolean;
    }
>;

export const name = "projectConfigs";

export const { reducer, actions } = createSlice({
    name,
    "initialState": createObjectThatThrowsIfAccessed<State>(),
    "reducers": {
        "initialized": (_, { payload }: PayloadAction<State>) => payload,
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
                userConfigs.thunks.changeValue({
                    "key": "selectedProjectId",
                    "value": projectId
                })
            );

            if (doPreventDispatch) {
                return;
            }

            dispatch(actions.projectChanged({ projectId }));
        },

    "renewServicePassword":
        () =>
        (...args) => {
            const [dispatch] = args;
            dispatch(
                privateThunks.changeConfigValue({
                    "key": "servicePassword",
                    "value": getDefaultConfig("servicePassword")
                })
            );
        },
    "getServicesPassword":
        () =>
        async (...args): Promise<string> => {
            const [dispatch] = args;

            const servicePassword = await dispatch(
                privateThunks.getConfigValue({ "key": "servicePassword" })
            );

            return servicePassword;
        }
} satisfies Thunks;

export const protectedThunks = {
    "initialize":
        () =>
        async (...args) => {
            const [dispatch, getState, { onyxiaApi, evtAction }] = args;

            evtAction.attach(
                data =>
                    data.sliceName === name &&
                    (data.actionName === "initialized" ||
                        data.actionName === "projectChanged"),
                async () => {
                    const isOnboarded = await dispatch(
                        privateThunks.getConfigValue({ "key": "isOnboarded" })
                    );

                    if (isOnboarded) {
                        return;
                    }

                    dispatch(actions.onboardingStarted());

                    await onyxiaApi.onboard();

                    await dispatch(
                        privateThunks.changeConfigValue({
                            "key": "isOnboarded",
                            "value": true
                        })
                    );

                    dispatch(actions.onboardingCompleted());
                }
            );

            const projects = await onyxiaApi.getUserProjects();

            let selectedProjectId = getState().userConfigs.selectedProjectId.value;

            if (
                selectedProjectId === null ||
                !projects.map(({ id }) => id).includes(selectedProjectId)
            ) {
                selectedProjectId = projects[0].id;

                await dispatch(
                    userConfigs.thunks.changeValue({
                        "key": "selectedProjectId",
                        "value": selectedProjectId
                    })
                );
            }

            dispatch(
                actions.initialized({
                    projects,
                    selectedProjectId,
                    "isOnboarding": false
                })
            );
        },
    "getIs":
        (params: { projectId: string }) =>
        (...args): boolean => {
            const { projectId } = params;

            const [, getState] = args;

            return getState()[name].projects[0].id === projectId;
        }
} satisfies Thunks;

const privateThunks = {
    "getDirPath":
        () =>
        (...args): string => {
            const [, getState] = args;

            const project = selectors.selectedProject(getState());

            return pathJoin("/", project.vaultTopDir, hiddenDirectoryBasename);
        },
    /**
    Here no state because other project user may have changed 
    the values here at any time. Unlike in userConfigs we
    can't assume that the values haven't changed since last fetch.
    We expose a non-reactive API to force the UI dev to take 
    that into account.
    */
    "changeConfigValue":
        <K extends keyof ProjectConfigs>(params: ChangeConfigValueParams<K>) =>
        async (...args) => {
            const [dispatch, , { secretsManager }] = args;

            const dirPath = dispatch(privateThunks.getDirPath());

            await secretsManager.put({
                "path": pathJoin(dirPath, params.key),
                "secret": { "value": params.value }
            });
        },
    "getConfigValue":
        <K extends keyof ProjectConfigs>(params: { key: K }) =>
        async (...args): Promise<ProjectConfigs[K]> => {
            const { key } = params;

            const [dispatch, , { secretsManager }] = args;

            const dirPath = dispatch(privateThunks.getDirPath());

            const value = await secretsManager
                .get({ "path": pathJoin(dirPath, key) })
                .then(({ secret }) => secret["value"] as ProjectConfigs[K])
                .catch(() => undefined);

            if (value === undefined) {
                const value = getDefaultConfig(key);

                await dispatch(
                    privateThunks.changeConfigValue({
                        key,
                        value
                    })
                );

                return value;
            }

            return value;
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

function getDefaultConfig<K extends keyof ProjectConfigs>(key_: K): ProjectConfigs[K] {
    const key = key_ as keyof ProjectConfigs;
    switch (key) {
        case "servicePassword": {
            const out: ProjectConfigs[typeof key] = generateRandomPassword();

            // @ts-expect-error
            return out;
        }
        case "isOnboarded": {
            const out: ProjectConfigs[typeof key] = false;
            // @ts-expect-error
            return out;
        }
    }

    assert(false);
}

export type ChangeConfigValueParams<
    K extends keyof ProjectConfigs = keyof ProjectConfigs
> = {
    key: K;
    value: ProjectConfigs[K];
};

export const createEvt = (({ evtAction }) =>
    evtAction.pipe(action =>
        action.sliceName === name && action.actionName === "projectChanged"
            ? [
                  {
                      "actionName": action.actionName,
                      "projectId": action.payload.projectId
                  }
              ]
            : null
    )) satisfies CreateEvt;
