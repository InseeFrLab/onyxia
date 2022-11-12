import type { FormFieldValue } from "./sharedDataModel/FormFieldValue";
import { formFieldsValueToObject } from "./sharedDataModel/FormFieldValue";
import { allEquals } from "evt/tools/reducers/allEquals";
import { same } from "evt/tools/inDepth/same";
import { assert } from "tsafe/assert";
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { ThunkAction } from "../setup";
import { thunks as userConfigsThunks } from "./userConfigs";
import {
    createObjectThatThrowsIfAccessedFactory,
    isPropertyAccessedByReduxOrStorybook,
} from "../tools/createObjectThatThrowsIfAccessed";
import type { RootState } from "../setup";
import { onyxiaFriendlyNameFormFieldPath } from "core/ports/OnyxiaApiClient";

type RestorablePackageConfigsState = {
    restorablePackageConfigs: RestorablePackageConfig[];
    packageIcons:
        | {
              areFetched: false;
              isFetching: boolean;
          }
        | {
              areFetched: true;
              iconsUrl: IconsUrl;
          };
};

type IconsUrl = {
    [catalogId: string]: { [packageName: string]: string };
};

export type RestorablePackageConfig = {
    catalogId: string;
    packageName: string;
    formFieldsValueDifferentFromDefault: FormFieldValue[];
};

const { createObjectThatThrowsIfAccessed } = createObjectThatThrowsIfAccessedFactory({
    "isPropertyWhitelisted": isPropertyAccessedByReduxOrStorybook,
});

export const name = "restorablePackageConfig";

export const { reducer, actions } = createSlice({
    name,
    "initialState": createObjectThatThrowsIfAccessed<RestorablePackageConfigsState>({
        "debugMessage": [
            "The restorablePackageConfigState should have been",
            "initialized during the store initialization",
        ].join(" "),
    }),
    "reducers": {
        "initializationCompleted": (
            _,
            {
                payload,
            }: PayloadAction<{
                restorablePackageConfigs: RestorablePackageConfig[];
            }>,
        ) => {
            const { restorablePackageConfigs } = payload;
            return {
                restorablePackageConfigs,
                "packageIcons": {
                    "areFetched": false,
                    "isFetching": false,
                },
            };
        },
        "fetchIconStarted": state => {
            assert(!state.packageIcons.areFetched);

            state.packageIcons.isFetching = true;
        },
        "iconsFetched": (state, { payload }: PayloadAction<{ iconsUrl: IconsUrl }>) => {
            const { iconsUrl } = payload;

            state.packageIcons = {
                "areFetched": true,
                iconsUrl,
            };
        },
        "restorablePackageConfigSaved": (
            state,
            {
                payload,
            }: PayloadAction<{
                restorablePackageConfig: RestorablePackageConfig;
            }>,
        ) => {
            const { restorablePackageConfig } = payload;

            state.restorablePackageConfigs.push(restorablePackageConfig);
        },
        "restorablePackageConfigDeleted": (
            state,
            {
                payload,
            }: PayloadAction<{
                restorablePackageConfig: RestorablePackageConfig;
            }>,
        ) => {
            const { restorablePackageConfig } = payload;

            const index = state.restorablePackageConfigs.findIndex(
                restorablePackageConfig_i =>
                    areSameRestorablePackageConfig(
                        restorablePackageConfig_i,
                        restorablePackageConfig,
                    ),
            );

            if (index <= -1) {
                return;
            }

            state.restorablePackageConfigs.splice(index, 1);
        },
    },
});

export const privateThunks = {
    "initialize": (): ThunkAction<void> => async (dispatch, getState) =>
        dispatch(
            actions.initializationCompleted({
                "restorablePackageConfigs": (() => {
                    const { value } =
                        getState().userConfigs.bookmarkedServiceConfigurationStr;

                    return value === null ? [] : JSON.parse(value);
                })(),
            }),
        ),
    "syncWithUserConfig": (): ThunkAction => async (dispatch, getState) =>
        dispatch(
            userConfigsThunks.changeValue({
                "key": "bookmarkedServiceConfigurationStr",
                "value": JSON.stringify(
                    getState().restorablePackageConfig.restorablePackageConfigs,
                ),
            }),
        ),
};

export const thunks = {
    "fetchIconsIfNotAlreadyDone":
        (): ThunkAction =>
        async (...args) => {
            const [dispatch, getState, { onyxiaApiClient }] = args;

            {
                const state = getState().restorablePackageConfig;

                if (state.packageIcons.areFetched || state.packageIcons.isFetching) {
                    return;
                }
            }

            dispatch(actions.fetchIconStarted());

            const apiRequestForIconsResult = await onyxiaApiClient.getCatalogs();

            const iconsUrl: IconsUrl = {};

            apiRequestForIconsResult.forEach(
                ({ id: catalogId, catalog: { packages } }) => {
                    const urlByPackageName: IconsUrl[string] = {};

                    packages.forEach(({ name: packageName, icon }) => {
                        if (icon === undefined) {
                            return;
                        }

                        urlByPackageName[packageName] = icon;
                    });

                    iconsUrl[catalogId] = urlByPackageName;
                },
            );

            dispatch(actions.iconsFetched({ iconsUrl }));
        },
    "saveRestorablePackageConfig":
        (params: {
            restorablePackageConfig: RestorablePackageConfig;
            getDoOverwriteConfiguration: (params: {
                friendlyName: string;
            }) => Promise<boolean>;
        }): ThunkAction =>
        async (dispatch, getState) => {
            const { restorablePackageConfig, getDoOverwriteConfiguration } = params;

            if (
                pure.isRestorablePackageConfigInStore({
                    "restorablePackageConfigs":
                        getState().restorablePackageConfig.restorablePackageConfigs,
                    restorablePackageConfig,
                })
            ) {
                return;
            }

            const getFriendlyName = (formFieldsValue: FormFieldValue[]) => {
                const friendlyName = formFieldsValue.find(({ path }) =>
                    same(path, onyxiaFriendlyNameFormFieldPath.split(".")),
                )?.value;
                assert(friendlyName === undefined || typeof friendlyName === "string");
                return friendlyName;
            };

            const restorablePackageConfigWithSameFriendlyName = getState()
                .restorablePackageConfig.restorablePackageConfigs.filter(
                    ({ catalogId, packageName }) =>
                        restorablePackageConfig.catalogId === catalogId &&
                        restorablePackageConfig.packageName === packageName,
                )
                .find(
                    ({ formFieldsValueDifferentFromDefault }) =>
                        getFriendlyName(formFieldsValueDifferentFromDefault) ===
                        getFriendlyName(
                            restorablePackageConfig.formFieldsValueDifferentFromDefault,
                        ),
                );

            if (restorablePackageConfigWithSameFriendlyName !== undefined) {
                if (
                    !(await getDoOverwriteConfiguration({
                        "friendlyName":
                            getFriendlyName(
                                restorablePackageConfig.formFieldsValueDifferentFromDefault,
                            ) ?? restorablePackageConfig.packageName,
                    }))
                ) {
                    return;
                }

                dispatch(
                    actions.restorablePackageConfigDeleted({
                        "restorablePackageConfig":
                            restorablePackageConfigWithSameFriendlyName,
                    }),
                );
            }

            dispatch(
                actions.restorablePackageConfigSaved({
                    restorablePackageConfig,
                }),
            );

            await dispatch(privateThunks.syncWithUserConfig());
        },
    "deleteRestorablePackageConfig":
        (params: { restorablePackageConfig: RestorablePackageConfig }): ThunkAction =>
        async dispatch => {
            const { restorablePackageConfig } = params;

            dispatch(
                actions.restorablePackageConfigDeleted({
                    restorablePackageConfig,
                }),
            );

            await dispatch(privateThunks.syncWithUserConfig());
        },
};

export const pure = {
    "isRestorablePackageConfigInStore": (params: {
        restorablePackageConfigs: RestorablePackageConfig[];
        restorablePackageConfig: RestorablePackageConfig;
    }) => {
        const { restorablePackageConfig, restorablePackageConfigs } = params;

        return !!restorablePackageConfigs.find(restorablePackageConfig_i =>
            areSameRestorablePackageConfig(
                restorablePackageConfig_i,
                restorablePackageConfig,
            ),
        );
    },
};

function areSameRestorablePackageConfig(
    restorablePackageConfiguration1: RestorablePackageConfig,
    restorablePackageConfiguration2: RestorablePackageConfig,
): boolean {
    return [restorablePackageConfiguration1, restorablePackageConfiguration2]
        .map(({ catalogId, packageName, formFieldsValueDifferentFromDefault }) => [
            catalogId,
            packageName,
            formFieldsValueToObject(formFieldsValueDifferentFromDefault),
        ])
        .reduce(...allEquals(same));
}

export const selectors = (() => {
    function displayableConfigs(rootState: RootState) {
        const { restorablePackageConfigs, packageIcons } =
            rootState.restorablePackageConfig;

        return restorablePackageConfigs
            .map(restorablePackageConfig => {
                const { packageName, catalogId } = restorablePackageConfig;

                return {
                    "logoUrl": !packageIcons.areFetched
                        ? undefined
                        : packageIcons.iconsUrl[catalogId]?.[packageName],
                    "friendlyName": (() => {
                        const friendlyName =
                            restorablePackageConfig.formFieldsValueDifferentFromDefault.find(
                                ({ path }) =>
                                    same(
                                        path,
                                        onyxiaFriendlyNameFormFieldPath.split("."),
                                    ),
                            )?.value ?? packageName;

                        assert(typeof friendlyName === "string");

                        return friendlyName;
                    })(),
                    restorablePackageConfig,
                };
            })
            .reverse();
    }

    return { displayableConfigs };
})();
