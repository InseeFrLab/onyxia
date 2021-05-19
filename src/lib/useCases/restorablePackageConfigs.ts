
import type { FormFieldValue } from "./sharedDataModel/FormFieldValue";
import { formFieldsValueToObject } from "./sharedDataModel/FormFieldValue";
import { allEquals } from "evt/tools/reducers/allEquals";
import { same } from "evt/tools/inDepth/same";
import { assert } from "tsafe/assert";
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { AppThunk } from "../setup";
import { thunks as userConfigsThunks } from "./userConfigs";
import { createObjectThatThrowsIfAccessedFactory, isPropertyAccessedByReduxOrStorybook } from "../tools/createObjectThatThrowsIfAccessed";

export const name = "restorablePackageConfig";

export type RestorablePackageConfigsState = {
    restorablePackageConfigs: RestorablePackageConfig[];
    packageIcons: {
        status: "notFetched";
        isFetching: boolean;
    } | {
        status: "fetched";
        iconsUrl: IconsUrl;
    };
};

export type IconsUrl = { [catalogId: string]: { [packageName: string]: string; } };

export type RestorablePackageConfig = {
    catalogId: string;
    packageName: string;
    formFieldsValueDifferentFromDefault: FormFieldValue[];
};


const { createObjectThatThrowsIfAccessed } = createObjectThatThrowsIfAccessedFactory(
    { "isPropertyWhitelisted": isPropertyAccessedByReduxOrStorybook }
);

const { reducer, actions } = createSlice({
    name,
    "initialState": createObjectThatThrowsIfAccessed<RestorablePackageConfigsState>({
        "debugMessage": [
            "The restorablePackageConfigState should have been",
            "initialized during the store initialization"
        ].join(" ")
    }),
    "reducers": {
        "initializationCompleted": (
            _,
            { payload }: PayloadAction<{ restorablePackageConfigs: RestorablePackageConfig[] }>
        ) => {
            const { restorablePackageConfigs } = payload;
            return {
                restorablePackageConfigs,
                "packageIcons": {
                    "status": "notFetched",
                    "isFetching": false
                }
            };
        },
        "fetchIconStarted": state => {

            assert(state.packageIcons.status === "notFetched");

            state.packageIcons.isFetching = true;

        },
        "iconsFetched": (state, { payload }: PayloadAction<{ iconsUrl: IconsUrl; }>) => {

            const { iconsUrl } = payload;

            state.packageIcons = {
                "status": "fetched",
                iconsUrl
            };

        },
        "restorablePackageConfigSaved": (
            state,
            { payload }: PayloadAction<{ restorablePackageConfig: RestorablePackageConfig; }>
        ) => {

            const { restorablePackageConfig } = payload;

            state.restorablePackageConfigs.push(restorablePackageConfig);

        },
        "restorablePackageConfigDeleted": (
            state,
            { payload }: PayloadAction<{ restorablePackageConfig: RestorablePackageConfig; }>
        ) => {
            const { restorablePackageConfig } = payload;

            const index = state.restorablePackageConfigs.findIndex(
                restorablePackageConfig_i =>
                    areSameRestorablePackageConfig(
                        restorablePackageConfig_i,
                        restorablePackageConfig
                    )
            );

            if (index <= -1) {
                return;
            }

            state.restorablePackageConfigs.splice(index, 1);

        }
    },
});

export { reducer };


export const privateThunks = {
    "initialize": (): AppThunk<void> => async (dispatch, getState) =>
        dispatch(
            actions.initializationCompleted({
                "restorablePackageConfigs": (() => {

                    const { value } = getState().userConfigs.bookmarkedServiceConfigurationStr;

                    return value === null ? [] : JSON.parse(value);

                })()
            })
        ),
    "syncWithUserConfig": (): AppThunk => async (dispatch, getState)=> 
         dispatch(
            userConfigsThunks.changeValue({
                "key": "bookmarkedServiceConfigurationStr",
                "value": JSON.stringify(
                    getState()
                        .restorablePackageConfig
                        .restorablePackageConfigs
                )
            })
        )
};


export const thunks = {
    "fetchIcons": (): AppThunk => async (...args) => {

        const [dispatch, , dependencies] = args;

        dispatch(actions.fetchIconStarted());

        const apiRequestForIconsResult = await dependencies.onyxiaApiClient.getCatalogs();

        const iconsUrl: IconsUrl = {};

        apiRequestForIconsResult.forEach(({ id: catalogId, catalog: { packages } }) => {

            const urlByPackageName: IconsUrl[string] = {};

            packages.forEach(({ name: packageName, icon }) => {

                if (icon === undefined) {
                    return;
                }

                urlByPackageName[packageName] = icon;

            });

            iconsUrl[catalogId] = urlByPackageName;

        });

        dispatch(actions.iconsFetched({ iconsUrl }));

    },
    "getFriendlyName": (
        params: {
            catalogId: string;
            packageName: string;
        }
    ): AppThunk<string> => (...args) => {
        const [, getState] = args;

        const { catalogId, packageName } = params;

        const friendlyName =
            getState()
                .restorablePackageConfig
                .restorablePackageConfigs.find(restorablePackageConfig => restorablePackageConfig.catalogId === catalogId)!
                .formFieldsValueDifferentFromDefault
                .find(({ path }) => same(path, onyxiaFriendlyNameFormFieldPath))?.value ??
            packageName;

        assert(typeof friendlyName !== "boolean");

        return friendlyName;

    },
    "isRestorablePackageConfigAlreadyInStore": (
        params: {
            restorablePackageConfig: RestorablePackageConfig;
        }
    ): AppThunk<boolean> => (...args) => {

        const { restorablePackageConfig } = params;

        const [, getState] = args;

        return !!getState()
            .restorablePackageConfig
            .restorablePackageConfigs
            .find(restorablePackageConfig_i =>
                areSameRestorablePackageConfig(
                    restorablePackageConfig_i,
                    restorablePackageConfig
                )
            );

    },
    "saveRestorablePackageConfig": (
        params: {
            restorablePackageConfig: RestorablePackageConfig;
        }
    ): AppThunk => async dispatch => {

        const { restorablePackageConfig } = params;

        if (
            dispatch(thunks.isRestorablePackageConfigAlreadyInStore({
                restorablePackageConfig
            }))
        ) {
            return;
        }

        dispatch(
            actions.restorablePackageConfigSaved({
                restorablePackageConfig
            })
        );

        await dispatch(privateThunks.syncWithUserConfig());

    },
    "deleteRestorablePackageConfig": (
        params: {
            restorablePackageConfig: RestorablePackageConfig;
        }
    ): AppThunk => async dispatch => {
        const { restorablePackageConfig } = params;

        dispatch(
            actions.restorablePackageConfigDeleted(
                { restorablePackageConfig }
            )
        );

        await dispatch(privateThunks.syncWithUserConfig());

    }
};

export const onyxiaFriendlyNameFormFieldPath = ["onyxia", "friendlyName"];

export function areSameRestorablePackageConfig(
    restorablePackageConfiguration1: RestorablePackageConfig,
    restorablePackageConfiguration2: RestorablePackageConfig
): boolean {

    return [
        restorablePackageConfiguration1,
        restorablePackageConfiguration2
    ]
        .map(({
            catalogId,
            packageName,
            formFieldsValueDifferentFromDefault
        }) => [
                catalogId,
                packageName,
                formFieldsValueToObject(formFieldsValueDifferentFromDefault)
            ])
        .reduce(...allEquals(same))

}


