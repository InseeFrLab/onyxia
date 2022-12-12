import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import { createObjectThatThrowsIfAccessed } from "redux-clean-architecture";
import type { State, ThunkAction } from "../setup";
import type { FormFieldValue } from "./sharedDataModel/FormFieldValue";
import { thunks as userConfigsThunks } from "./userConfigs";

type RestorableLaunchPackageConfigsState = {
    restorableLaunchPackageConfigs: RestorableLaunchPackageConfig[];
};

export type RestorableLaunchPackageConfig = {
    name: string;
    catalogId: string;
    packageName: string;
    formFieldsValueDifferentFromDefault: FormFieldValue[];
};

export const name = "restorableLaunchPackageConfig";

export const { reducer, actions } = createSlice({
    name,
    "initialState": createObjectThatThrowsIfAccessed<RestorableLaunchPackageConfigsState>(
        {
            "debugMessage": [
                "The restorableLaunchPackageConfigstate should have been",
                "initialized during the store initialization"
            ].join(" ")
        }
    ),
    "reducers": {
        "initializationCompleted": (
            _,
            {
                payload
            }: PayloadAction<{
                restorableLaunchPackageConfigs: RestorableLaunchPackageConfig[];
            }>
        ) => {
            const { restorableLaunchPackageConfigs } = payload;
            return {
                restorableLaunchPackageConfigs
            };
        },

        "restorableLaunchPackageConfigsaved": (
            state,
            {
                payload
            }: PayloadAction<{
                restorableLaunchPackageConfig: RestorableLaunchPackageConfig;
            }>
        ) => {
            const { restorableLaunchPackageConfig } = payload;

            state.restorableLaunchPackageConfigs.push(restorableLaunchPackageConfig);
        },
        "restorableLaunchPackageConfigDeleted": (
            state,
            {
                payload
            }: PayloadAction<{
                serviceId: string;
            }>
        ) => {
            const { serviceId } = payload;

            const index = state.restorableLaunchPackageConfigs.findIndex(
                restorableLaunchPackageConfig_i =>
                    restorableLaunchPackageConfig_i.name === serviceId
            );

            if (index <= -1) {
                return;
            }

            state.restorableLaunchPackageConfigs.splice(index, 1);
        }
    }
});

export const privateThunks = {
    "initialize": (): ThunkAction<void> => async (dispatch, getState) =>
        dispatch(
            actions.initializationCompleted({
                "restorableLaunchPackageConfigs": (() => {
                    const { value } =
                        getState().userConfigs.launchServicesConfigurationStr;

                    return value === null ? [] : JSON.parse(value);
                })()
            })
        ),
    "syncWithUserConfig": (): ThunkAction => async (dispatch, getState) =>
        dispatch(
            userConfigsThunks.changeValue({
                "key": "launchServicesConfigurationStr",
                "value": JSON.stringify(
                    getState().restorableLaunchPackageConfig
                        .restorableLaunchPackageConfigs
                )
            })
        )
};

export const thunks = {
    "saveRestorableLaunchPackageConfig":
        (params: {
            restorableLaunchPackageConfig: RestorableLaunchPackageConfig;
        }): ThunkAction =>
        async (dispatch, getState) => {
            const { restorableLaunchPackageConfig } = params;
            if (
                isrestorableLaunchPackageConfigInStore({
                    "restorableLaunchPackageConfigs":
                        getState().restorableLaunchPackageConfig
                            .restorableLaunchPackageConfigs,
                    restorableLaunchPackageConfig
                })
            ) {
                return;
            }

            const restorableLaunchPackageConfigWithSameName = getState()
                .restorableLaunchPackageConfig.restorableLaunchPackageConfigs.filter(
                    ({ catalogId, packageName }) =>
                        restorableLaunchPackageConfig.catalogId === catalogId &&
                        restorableLaunchPackageConfig.packageName === packageName
                )
                .find(({ name }) => restorableLaunchPackageConfig.name === name);

            if (restorableLaunchPackageConfigWithSameName !== undefined) {
                dispatch(
                    actions.restorableLaunchPackageConfigDeleted({
                        "serviceId": restorableLaunchPackageConfigWithSameName.name
                    })
                );
            }

            dispatch(
                actions.restorableLaunchPackageConfigsaved({
                    restorableLaunchPackageConfig
                })
            );
            await dispatch(privateThunks.syncWithUserConfig());
        },
    "deleterestorableLaunchPackageConfig":
        (params: { serviceId: string }): ThunkAction =>
        async dispatch => {
            const { serviceId } = params;

            dispatch(
                actions.restorableLaunchPackageConfigDeleted({
                    serviceId
                })
            );
            await dispatch(privateThunks.syncWithUserConfig());
        },
    /** Pure */
    "isrestorableLaunchPackageConfigInStore":
        (params: {
            restorableLaunchPackageConfigs: RestorableLaunchPackageConfig[];
            restorableLaunchPackageConfig: RestorableLaunchPackageConfig;
        }): ThunkAction<boolean> =>
        () =>
            isrestorableLaunchPackageConfigInStore(params)
};

function isrestorableLaunchPackageConfigInStore(params: {
    restorableLaunchPackageConfigs: RestorableLaunchPackageConfig[];
    restorableLaunchPackageConfig: RestorableLaunchPackageConfig;
}) {
    const { restorableLaunchPackageConfig, restorableLaunchPackageConfigs } = params;

    return !!restorableLaunchPackageConfigs.find(restorableLaunchPackageConfig_i =>
        areSamerestorableLaunchPackageConfig(
            restorableLaunchPackageConfig_i,
            restorableLaunchPackageConfig
        )
    );
}

function areSamerestorableLaunchPackageConfig(
    restorableLaunchPackageConfiguration1: RestorableLaunchPackageConfig,
    restorableLaunchPackageConfiguration2: RestorableLaunchPackageConfig
): boolean {
    return (
        restorableLaunchPackageConfiguration1.name ===
        restorableLaunchPackageConfiguration2.name
    );
}

export const selectors = (() => {
    function restorableContainerConfigs(rootState: State) {
        const { restorableLaunchPackageConfigs } =
            rootState.restorableLaunchPackageConfig;

        return restorableLaunchPackageConfigs
            .map(restorableLaunchPackageConfig => {
                return {
                    restorableLaunchPackageConfig
                };
            })
            .reverse();
    }

    return { restorableContainerConfigs };
})();
