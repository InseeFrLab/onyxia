import { type FormFieldValue, formFieldsValueToObject } from "./launcher/FormField";
import { allEquals } from "evt/tools/reducers/allEquals";
import { same } from "evt/tools/inDepth/same";
import { assert } from "tsafe/assert";
import { createSlice, createSelector } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { Thunks } from "../core";
import { thunks as userConfigsThunks } from "./userConfigs";
import { createObjectThatThrowsIfAccessed } from "redux-clean-architecture";
import type { State as RootState } from "../core";
import { onyxiaFriendlyNameFormFieldPath } from "core/ports/OnyxiaApi";

type State = {
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
    [catalogId: string]: { [packageName: string]: string | undefined };
};

export type RestorablePackageConfig = {
    catalogId: string;
    packageName: string;
    formFieldsValueDifferentFromDefault: FormFieldValue[];
};

export const name = "restorablePackageConfig";

export const { reducer, actions } = createSlice({
    name,
    "initialState": createObjectThatThrowsIfAccessed<State>({
        "debugMessage": [
            "The restorablePackageConfigState should have been",
            "initialized during the store initialization"
        ].join(" ")
    }),
    "reducers": {
        "initializationCompleted": (
            _,
            {
                payload
            }: PayloadAction<{
                restorablePackageConfigs: RestorablePackageConfig[];
            }>
        ) => {
            const { restorablePackageConfigs } = payload;
            return {
                restorablePackageConfigs,
                "packageIcons": {
                    "areFetched": false,
                    "isFetching": false
                }
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
                iconsUrl
            };
        },
        "restorablePackageConfigSaved": (
            state,
            {
                payload
            }: PayloadAction<{
                restorablePackageConfig: RestorablePackageConfig;
            }>
        ) => {
            const { restorablePackageConfig } = payload;

            state.restorablePackageConfigs.push(restorablePackageConfig);
        },
        "restorablePackageConfigDeleted": (
            state,
            {
                payload
            }: PayloadAction<{
                restorablePackageConfig: RestorablePackageConfig;
            }>
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
    }
});

export const protectedThunks = {
    "initialize":
        () =>
        async (...args) => {
            const [dispatch, getState] = args;
            dispatch(
                actions.initializationCompleted({
                    "restorablePackageConfigs": (() => {
                        const { value } =
                            getState().userConfigs.bookmarkedServiceConfigurationStr;

                        return value === null ? [] : JSON.parse(value);
                    })()
                })
            );
        }
} satisfies Thunks;

const privateThunks = {
    "syncWithUserConfig":
        () =>
        async (...args) => {
            const [dispatch, getState] = args;
            dispatch(
                userConfigsThunks.changeValue({
                    "key": "bookmarkedServiceConfigurationStr",
                    "value": JSON.stringify(
                        getState().restorablePackageConfig.restorablePackageConfigs
                    )
                })
            );
        }
} satisfies Thunks;

export const thunks = {
    "fetchIconsIfNotAlreadyDone":
        () =>
        async (...args) => {
            const [dispatch, getState, { onyxiaApi }] = args;

            {
                const state = getState().restorablePackageConfig;

                if (state.packageIcons.areFetched || state.packageIcons.isFetching) {
                    return;
                }
            }

            dispatch(actions.fetchIconStarted());

            const apiRequestForIconsResult = await onyxiaApi.getCatalogsAndCharts();

            const iconsUrl: IconsUrl = {};

            apiRequestForIconsResult.catalogs.forEach(({ id: catalogId }) => {
                const urlByPackageName: IconsUrl[string] = {};

                apiRequestForIconsResult.chartsByCatalogId[catalogId].forEach(chart => {
                    for (const { icon } of chart.versions) {
                        if (icon === undefined) {
                            continue;
                        }
                        urlByPackageName[chart.name] = icon;
                        return;
                    }
                    urlByPackageName[chart.name] = undefined;
                });

                iconsUrl[catalogId] = urlByPackageName;
            });

            dispatch(actions.iconsFetched({ iconsUrl }));
        },
    "saveRestorablePackageConfig":
        (params: {
            restorablePackageConfig: RestorablePackageConfig;
            getDoOverwriteConfiguration: (params: {
                friendlyName: string;
            }) => Promise<boolean>;
        }) =>
        async (...args) => {
            const [dispatch, getState] = args;

            const { restorablePackageConfig, getDoOverwriteConfiguration } = params;

            if (
                getIsRestorablePackageConfigInStore({
                    "restorablePackageConfigs":
                        getState().restorablePackageConfig.restorablePackageConfigs,
                    restorablePackageConfig
                })
            ) {
                return;
            }

            const getFriendlyName = (formFieldsValue: FormFieldValue[]) => {
                const friendlyName = formFieldsValue.find(({ path }) =>
                    same(path, onyxiaFriendlyNameFormFieldPath.split("."))
                )?.value;
                assert(friendlyName === undefined || typeof friendlyName === "string");
                return friendlyName;
            };

            const restorablePackageConfigWithSameFriendlyName = getState()
                .restorablePackageConfig.restorablePackageConfigs.filter(
                    ({ catalogId, packageName }) =>
                        restorablePackageConfig.catalogId === catalogId &&
                        restorablePackageConfig.packageName === packageName
                )
                .find(
                    ({ formFieldsValueDifferentFromDefault }) =>
                        getFriendlyName(formFieldsValueDifferentFromDefault) ===
                        getFriendlyName(
                            restorablePackageConfig.formFieldsValueDifferentFromDefault
                        )
                );

            if (restorablePackageConfigWithSameFriendlyName !== undefined) {
                if (
                    !(await getDoOverwriteConfiguration({
                        "friendlyName":
                            getFriendlyName(
                                restorablePackageConfig.formFieldsValueDifferentFromDefault
                            ) ?? restorablePackageConfig.packageName
                    }))
                ) {
                    return;
                }

                dispatch(
                    actions.restorablePackageConfigDeleted({
                        "restorablePackageConfig":
                            restorablePackageConfigWithSameFriendlyName
                    })
                );
            }

            dispatch(
                actions.restorablePackageConfigSaved({
                    restorablePackageConfig
                })
            );

            await dispatch(privateThunks.syncWithUserConfig());
        },
    "deleteRestorablePackageConfig":
        (params: { restorablePackageConfig: RestorablePackageConfig }) =>
        async (...args) => {
            const [dispatch] = args;

            const { restorablePackageConfig } = params;

            dispatch(
                actions.restorablePackageConfigDeleted({
                    restorablePackageConfig
                })
            );

            await dispatch(privateThunks.syncWithUserConfig());
        },
    /** Pure */
    "getIsRestorablePackageConfigInStore":
        (params: {
            restorablePackageConfigs: RestorablePackageConfig[];
            restorablePackageConfig: RestorablePackageConfig;
        }) =>
        (): boolean =>
            getIsRestorablePackageConfigInStore(params)
} satisfies Thunks;

function getIsRestorablePackageConfigInStore(params: {
    restorablePackageConfigs: RestorablePackageConfig[];
    restorablePackageConfig: RestorablePackageConfig;
}) {
    const { restorablePackageConfig, restorablePackageConfigs } = params;

    return (
        restorablePackageConfigs.find(restorablePackageConfig_i =>
            areSameRestorablePackageConfig(
                restorablePackageConfig_i,
                restorablePackageConfig
            )
        ) !== undefined
    );
}

function areSameRestorablePackageConfig(
    restorablePackageConfiguration1: RestorablePackageConfig,
    restorablePackageConfiguration2: RestorablePackageConfig
): boolean {
    return [restorablePackageConfiguration1, restorablePackageConfiguration2]
        .map(({ catalogId, packageName, formFieldsValueDifferentFromDefault }) => [
            catalogId,
            packageName,
            formFieldsValueToObject(formFieldsValueDifferentFromDefault)
        ])
        .reduce(...allEquals(same));
}

export const selectors = (() => {
    function state(rootState: RootState) {
        return rootState[name];
    }

    const restorablePackageConfigs = createSelector(
        state,
        state => state.restorablePackageConfigs
    );

    const displayableConfigs = createSelector(
        state,
        restorablePackageConfigs,
        (state, restorablePackageConfigs) => {
            const { packageIcons } = state;

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
                                            onyxiaFriendlyNameFormFieldPath.split(".")
                                        )
                                )?.value ?? packageName;

                            assert(typeof friendlyName === "string");

                            return friendlyName;
                        })(),
                        restorablePackageConfig
                    };
                })
                .reverse();
        }
    );

    return {
        restorablePackageConfigs,
        displayableConfigs
    };
})();
