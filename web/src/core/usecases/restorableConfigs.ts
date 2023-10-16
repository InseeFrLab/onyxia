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
    restorableConfigs: RestorableConfig[];
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

export type RestorableConfig = {
    catalogId: string;
    packageName: string;
    formFieldsValueDifferentFromDefault: FormFieldValue[];
};

export const name = "restorableConfig";

export const { reducer, actions } = createSlice({
    name,
    "initialState": createObjectThatThrowsIfAccessed<State>({
        "debugMessage": [
            "The restorableConfigState should have been",
            "initialized during the store initialization"
        ].join(" ")
    }),
    "reducers": {
        "initializationCompleted": (
            _,
            {
                payload
            }: PayloadAction<{
                restorableConfigs: RestorableConfig[];
            }>
        ) => {
            const { restorableConfigs } = payload;
            return {
                restorableConfigs,
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
        "restorableConfigSaved": (
            state,
            {
                payload
            }: PayloadAction<{
                restorableConfig: RestorableConfig;
            }>
        ) => {
            const { restorableConfig } = payload;

            state.restorableConfigs.push(restorableConfig);
        },
        "restorableConfigDeleted": (
            state,
            {
                payload
            }: PayloadAction<{
                restorableConfig: RestorableConfig;
            }>
        ) => {
            const { restorableConfig } = payload;

            const index = state.restorableConfigs.findIndex(restorableConfig_i =>
                areSameRestorableConfig(restorableConfig_i, restorableConfig)
            );

            if (index <= -1) {
                return;
            }

            state.restorableConfigs.splice(index, 1);
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
                    "restorableConfigs": (() => {
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
                    "value": JSON.stringify(getState().restorableConfig.restorableConfigs)
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
                const state = getState().restorableConfig;

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
    "saveRestorableConfig":
        (params: {
            restorableConfig: RestorableConfig;
            getDoOverwriteConfiguration: (params: {
                friendlyName: string;
            }) => Promise<boolean>;
        }) =>
        async (...args) => {
            const [dispatch, getState] = args;

            const { restorableConfig, getDoOverwriteConfiguration } = params;

            if (
                getIsRestorableConfigInStore({
                    "restorableConfigs": getState().restorableConfig.restorableConfigs,
                    restorableConfig
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

            const restorableConfigWithSameFriendlyName = getState()
                .restorableConfig.restorableConfigs.filter(
                    ({ catalogId, packageName }) =>
                        restorableConfig.catalogId === catalogId &&
                        restorableConfig.packageName === packageName
                )
                .find(
                    ({ formFieldsValueDifferentFromDefault }) =>
                        getFriendlyName(formFieldsValueDifferentFromDefault) ===
                        getFriendlyName(
                            restorableConfig.formFieldsValueDifferentFromDefault
                        )
                );

            if (restorableConfigWithSameFriendlyName !== undefined) {
                if (
                    !(await getDoOverwriteConfiguration({
                        "friendlyName":
                            getFriendlyName(
                                restorableConfig.formFieldsValueDifferentFromDefault
                            ) ?? restorableConfig.packageName
                    }))
                ) {
                    return;
                }

                dispatch(
                    actions.restorableConfigDeleted({
                        "restorableConfig": restorableConfigWithSameFriendlyName
                    })
                );
            }

            dispatch(
                actions.restorableConfigSaved({
                    restorableConfig
                })
            );

            await dispatch(privateThunks.syncWithUserConfig());
        },
    "deleteRestorableConfig":
        (params: { restorableConfig: RestorableConfig }) =>
        async (...args) => {
            const [dispatch] = args;

            const { restorableConfig } = params;

            dispatch(
                actions.restorableConfigDeleted({
                    restorableConfig
                })
            );

            await dispatch(privateThunks.syncWithUserConfig());
        },
    /** Pure */
    "getIsRestorableConfigInStore":
        (params: {
            restorableConfigs: RestorableConfig[];
            restorableConfig: RestorableConfig;
        }) =>
        (): boolean =>
            getIsRestorableConfigInStore(params)
} satisfies Thunks;

function getIsRestorableConfigInStore(params: {
    restorableConfigs: RestorableConfig[];
    restorableConfig: RestorableConfig;
}) {
    const { restorableConfig, restorableConfigs } = params;

    return (
        restorableConfigs.find(restorableConfig_i =>
            areSameRestorableConfig(restorableConfig_i, restorableConfig)
        ) !== undefined
    );
}

function areSameRestorableConfig(
    restorableConfiguration1: RestorableConfig,
    restorableConfiguration2: RestorableConfig
): boolean {
    return [restorableConfiguration1, restorableConfiguration2]
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

    const restorableConfigs = createSelector(state, state => state.restorableConfigs);

    const displayableConfigs = createSelector(
        state,
        restorableConfigs,
        (state, restorableConfigs) => {
            const { packageIcons } = state;

            return restorableConfigs
                .map(restorableConfig => {
                    const { packageName, catalogId } = restorableConfig;

                    return {
                        "logoUrl": !packageIcons.areFetched
                            ? undefined
                            : packageIcons.iconsUrl[catalogId]?.[packageName],
                        "friendlyName": (() => {
                            const friendlyName =
                                restorableConfig.formFieldsValueDifferentFromDefault.find(
                                    ({ path }) =>
                                        same(
                                            path,
                                            onyxiaFriendlyNameFormFieldPath.split(".")
                                        )
                                )?.value ?? packageName;

                            assert(typeof friendlyName === "string");

                            return friendlyName;
                        })(),
                        restorableConfig
                    };
                })
                .reverse();
        }
    );

    return {
        restorableConfigs,
        displayableConfigs
    };
})();
