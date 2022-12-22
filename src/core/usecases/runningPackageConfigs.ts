import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import { createObjectThatThrowsIfAccessed } from "redux-clean-architecture";
import type { State, ThunkAction } from "../setup";
import type { FormFieldValue } from "./sharedDataModel/FormFieldValue";
import { thunks as userConfigsThunks } from "./userConfigs";

type RunningPackageConfigsState = {
    runningPackageConfigs: RunningPackageConfig[];
};

export type RunningPackageConfig = {
    name: string;
    catalogId: string;
    packageName: string;
    formFieldsValueDifferentFromDefault: FormFieldValue[];
};

export const name = "runningPackageConfigs";

export const { reducer, actions } = createSlice({
    name,
    "initialState": createObjectThatThrowsIfAccessed<RunningPackageConfigsState>({
        "debugMessage": [
            "The runningPackageConfigstate should have been",
            "initialized during the store initialization"
        ].join(" ")
    }),
    "reducers": {
        "initializationCompleted": (
            _,
            {
                payload
            }: PayloadAction<{
                runningPackageConfigs: RunningPackageConfig[];
            }>
        ) => {
            const { runningPackageConfigs } = payload;
            return {
                runningPackageConfigs
            };
        },

        "runningPackageConfigSaved": (
            state,
            {
                payload
            }: PayloadAction<{
                runningPackageConfig: RunningPackageConfig;
            }>
        ) => {
            const { runningPackageConfig } = payload;

            state.runningPackageConfigs.push(runningPackageConfig);
        },
        "runningPackageConfigDeleted": (
            state,
            {
                payload
            }: PayloadAction<{
                serviceId: string;
            }>
        ) => {
            const { serviceId } = payload;

            const index = state.runningPackageConfigs.findIndex(
                runningPackageConfig_i => runningPackageConfig_i.name === serviceId
            );

            if (index <= -1) {
                return;
            }

            state.runningPackageConfigs.splice(index, 1);
        }
    }
});

export const privateThunks = {
    "initialize": (): ThunkAction<void> => async (dispatch, getState) =>
        dispatch(
            actions.initializationCompleted({
                "runningPackageConfigs": (() => {
                    const { value } =
                        getState().userConfigs.runningPackagesConfigurationStr;

                    return value === null ? [] : JSON.parse(value);
                })()
            })
        ),
    "syncWithUserConfig": (): ThunkAction => async (dispatch, getState) =>
        dispatch(
            userConfigsThunks.changeValue({
                "key": "runningPackagesConfigurationStr",
                "value": JSON.stringify(
                    getState().runningPackageConfigs.runningPackageConfigs
                )
            })
        )
};

export const thunks = {
    "saveRunningPackageConfig":
        (params: { runningPackageConfig: RunningPackageConfig }): ThunkAction =>
        async (dispatch, getState) => {
            const { runningPackageConfig } = params;
            if (
                isRunningPackageConfigInStore({
                    "runningPackageConfigs":
                        getState().runningPackageConfigs.runningPackageConfigs,
                    runningPackageConfig: runningPackageConfig
                })
            ) {
                return;
            }

            const runningPackageConfigWithSameName = getState()
                .runningPackageConfigs.runningPackageConfigs.filter(
                    ({ catalogId, packageName }) =>
                        runningPackageConfig.catalogId === catalogId &&
                        runningPackageConfig.packageName === packageName
                )
                .find(({ name }) => runningPackageConfig.name === name);

            if (runningPackageConfigWithSameName !== undefined) {
                dispatch(
                    actions.runningPackageConfigDeleted({
                        "serviceId": runningPackageConfigWithSameName.name
                    })
                );
            }

            dispatch(
                actions.runningPackageConfigSaved({
                    runningPackageConfig: runningPackageConfig
                })
            );
            await dispatch(privateThunks.syncWithUserConfig());
        },
    "deleteRunningPackageConfig":
        (params: { serviceId: string }): ThunkAction =>
        async dispatch => {
            const { serviceId } = params;

            dispatch(
                actions.runningPackageConfigDeleted({
                    serviceId
                })
            );
            await dispatch(privateThunks.syncWithUserConfig());
        },
    /** Pure */
    "isRestorableRunningConfigInStore":
        (params: {
            runningPackageConfigs: RunningPackageConfig[];
            runningPackageConfig: RunningPackageConfig;
        }): ThunkAction<boolean> =>
        () =>
            isRunningPackageConfigInStore(params)
};

function isRunningPackageConfigInStore(params: {
    runningPackageConfigs: RunningPackageConfig[];
    runningPackageConfig: RunningPackageConfig;
}) {
    const { runningPackageConfig, runningPackageConfigs } = params;

    return !!runningPackageConfigs.find(runningPackageConfig_i =>
        areSameRunningPackageConfig(runningPackageConfig_i, runningPackageConfig)
    );
}

function areSameRunningPackageConfig(
    runningPackageConfiguration1: RunningPackageConfig,
    runningPackageConfiguration2: RunningPackageConfig
): boolean {
    return runningPackageConfiguration1.name === runningPackageConfiguration2.name;
}

export const selectors = (() => {
    function restorableRunnigPackageConfigs(rootState: State) {
        const { runningPackageConfigs } = rootState.runningPackageConfigs;

        return runningPackageConfigs
            .map(runningPackageConfig => {
                return {
                    runningPackageConfig
                };
            })
            .reverse();
    }

    return { restorableRunnigPackageConfigs };
})();
