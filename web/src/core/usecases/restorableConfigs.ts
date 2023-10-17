import { type FormFieldValue, formFieldsValueToObject } from "./launcher/FormField";
import { allEquals } from "evt/tools/reducers/allEquals";
import { same } from "evt/tools/inDepth/same";
import { assert } from "tsafe/assert";
import { createSlice, createSelector } from "@reduxjs/toolkit";
import type { Thunks } from "../core";
import { thunks as userConfigsThunks } from "./userConfigs";
import { createObjectThatThrowsIfAccessed } from "redux-clean-architecture";
import type { State as RootState } from "../core";
import { onyxiaFriendlyNameFormFieldPath } from "core/ports/OnyxiaApi";

type State = {
    restorableConfigs: RestorableConfig[];
    chartIconUrlByChartNameAndCatalogId: ChartIconUrlByChartNameAndCatalogId | undefined;
};

type ChartIconUrlByChartNameAndCatalogId = {
    [catalogId: string]: { [chartName: string]: string | undefined };
};

export type RestorableConfig = {
    catalogId: string;
    chartName: string;
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
            }: {
                payload: {
                    restorableConfigs: RestorableConfig[];
                };
            }
        ) => {
            const { restorableConfigs } = payload;
            return {
                restorableConfigs,
                "chartIconUrlByChartNameAndCatalogId": undefined
            };
        },
        "chartIconsFetched": (
            state,
            {
                payload
            }: {
                payload: {
                    chartIconUrlByChartNameAndCatalogId: ChartIconUrlByChartNameAndCatalogId;
                };
            }
        ) => {
            const { chartIconUrlByChartNameAndCatalogId } = payload;

            state.chartIconUrlByChartNameAndCatalogId =
                chartIconUrlByChartNameAndCatalogId;
        },
        "restorableConfigsUpdated": (
            state,
            {
                payload
            }: {
                payload: {
                    restorableConfigs: RestorableConfig[];
                };
            }
        ) => {
            const { restorableConfigs } = payload;

            state.restorableConfigs = restorableConfigs;
        }
    }
});

export const protectedThunks = {
    "initialize":
        () =>
        async (...args) => {
            const [dispatch, getState, { onyxiaApi }] = args;
            dispatch(
                actions.initializationCompleted({
                    "restorableConfigs": (() => {
                        const { value } = getState().userConfigs.restorableConfigsStr;

                        return value === null ? [] : JSON.parse(value);
                    })()
                })
            );

            // NOTE: We don't want to block the initialization
            // we can proceed to fetch the icons in parallel.
            (async () => {
                const { catalogs, chartsByCatalogId } =
                    await onyxiaApi.getCatalogsAndCharts();

                const chartIconUrlByChartNameAndCatalogId: ChartIconUrlByChartNameAndCatalogId =
                    {};

                catalogs.forEach(({ id: catalogId }) => {
                    const chartIconUrlByChartName: ChartIconUrlByChartNameAndCatalogId[string] =
                        {};

                    chartsByCatalogId[catalogId].forEach(
                        chart =>
                            (chartIconUrlByChartName[chart.name] =
                                chart.versions[0].iconUrl)
                    );

                    chartIconUrlByChartNameAndCatalogId[catalogId] =
                        chartIconUrlByChartName;
                });

                dispatch(
                    actions.chartIconsFetched({ chartIconUrlByChartNameAndCatalogId })
                );
            })();
        }
} satisfies Thunks;

const privateThunks = {
    "syncWithUserConfig":
        () =>
        async (...args) => {
            const [dispatch, getState] = args;
            dispatch(
                userConfigsThunks.changeValue({
                    "key": "restorableConfigsStr",
                    "value": JSON.stringify(getState().restorableConfig.restorableConfigs)
                })
            );
        }
} satisfies Thunks;

export const thunks = {
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

            const state = getState()[name];

            if (
                getIsRestorableConfigInStore({
                    "restorableConfigs": state.restorableConfigs,
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

            const restorableConfigWithSameFriendlyName = state.restorableConfigs
                .filter(
                    ({ catalogId, chartName }) =>
                        restorableConfig.catalogId === catalogId &&
                        restorableConfig.chartName === chartName
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
                            ) ?? restorableConfig.chartName
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
                actions.restorableConfigsUpdated({
                    "restorableConfigs": [...state.restorableConfigs, restorableConfig]
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
        .map(({ catalogId, chartName, formFieldsValueDifferentFromDefault }) => [
            catalogId,
            chartName,
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
            const { iconUrlOfCharts } = state;

            return restorableConfigs
                .map(restorableConfig => {
                    const { chartName, catalogId } = restorableConfig;

                    return {
                        "chartIconUrl": !iconUrlOfCharts.areFetched
                            ? undefined
                            : iconUrlOfCharts.chartIconUrlByChartNameAndCatalogId[
                                  catalogId
                              ]?.[chartName],
                        "friendlyName": (() => {
                            const friendlyName =
                                restorableConfig.formFieldsValueDifferentFromDefault.find(
                                    ({ path }) =>
                                        same(
                                            path,
                                            onyxiaFriendlyNameFormFieldPath.split(".")
                                        )
                                )?.value ?? chartName;

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
