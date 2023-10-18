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

export const name = "restorableConfigManager";

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
        },
    "getSavedConfigWithSameFriendlyName":
        (params: { restorableConfig: RestorableConfig }) =>
        (...args): RestorableConfig | undefined => {
            const [, getState] = args;

            const { restorableConfig } = params;

            const { restorableConfigs } = getState()[name];

            return restorableConfigs.find(
                ({ formFieldsValueDifferentFromDefault }) =>
                    readFriendlyName(formFieldsValueDifferentFromDefault) ===
                    readFriendlyName(restorableConfig.formFieldsValueDifferentFromDefault)
            );
        }
} satisfies Thunks;

export const thunks = {
    "saveRestorableConfig":
        (params: { restorableConfig: RestorableConfig }) =>
        async (...args) => {
            const [dispatch, getState] = args;

            const { restorableConfig } = params;

            const { restorableConfigs } = getState()[name];

            const restorableConfigWithSameFriendlyName = dispatch(
                privateThunks.getSavedConfigWithSameFriendlyName({ restorableConfig })
            );

            dispatch(
                actions.restorableConfigsUpdated({
                    "restorableConfigs":
                        restorableConfigWithSameFriendlyName === undefined
                            ? [...restorableConfigs, restorableConfig]
                            : restorableConfigs.map(restorableConfig_i =>
                                  restorableConfig_i ===
                                  restorableConfigWithSameFriendlyName
                                      ? restorableConfig
                                      : restorableConfig_i
                              )
                })
            );

            await dispatch(privateThunks.syncWithUserConfig());
        },
    "deleteRestorableConfig":
        (params: { restorableConfig: RestorableConfig }) =>
        async (...args) => {
            const [dispatch, getState] = args;

            const { restorableConfig } = params;

            const { restorableConfigs } = getState()[name];

            const indexOfRestorableConfigToDelete = restorableConfigs.findIndex(
                restorableConfig_i =>
                    areSameRestorableConfig(restorableConfig_i, restorableConfig)
            );

            assert(
                indexOfRestorableConfigToDelete !== -1,
                "Restorable config do not exist"
            );

            dispatch(
                actions.restorableConfigsUpdated({
                    "restorableConfigs": restorableConfigs.filter(
                        (_, index) => index !== indexOfRestorableConfigToDelete
                    )
                })
            );

            await dispatch(privateThunks.syncWithUserConfig());
        },
    "getIsThereASavedConfigWithSameFriendlyName":
        (params: { restorableConfig: RestorableConfig }) =>
        (...args): boolean => {
            const { restorableConfig } = params;

            const [dispatch] = args;

            return (
                dispatch(
                    privateThunks.getSavedConfigWithSameFriendlyName({ restorableConfig })
                ) !== undefined
            );
        }
} satisfies Thunks;

export function areSameRestorableConfig(
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

function readFriendlyName(formFieldsValue: FormFieldValue[]) {
    const friendlyName = formFieldsValue.find(({ path }) =>
        same(path, onyxiaFriendlyNameFormFieldPath.split("."))
    )?.value;
    assert(friendlyName === undefined || typeof friendlyName === "string");
    return friendlyName;
}

export const selectors = (() => {
    function state(rootState: RootState) {
        return rootState[name];
    }

    const restorableConfigs = createSelector(state, state =>
        [...state.restorableConfigs].reverse()
    );

    const chartIconAndFriendlyNameByRestorableConfigIndex = createSelector(
        state,
        restorableConfigs,
        (
            state,
            restorableConfigs
        ): Record<number, { friendlyName: string; chartIconUrl: string | undefined }> => {
            const { chartIconUrlByChartNameAndCatalogId } = state;

            return Object.fromEntries(
                restorableConfigs.map((restorableConfig, restorableConfigIndex) => [
                    restorableConfigIndex,
                    {
                        "chartIconUrl":
                            chartIconUrlByChartNameAndCatalogId === undefined
                                ? undefined
                                : chartIconUrlByChartNameAndCatalogId[
                                      restorableConfig.catalogId
                                  ]?.[restorableConfig.chartName],
                        "friendlyName":
                            readFriendlyName(
                                restorableConfig.formFieldsValueDifferentFromDefault
                            ) ?? restorableConfig.chartName
                    }
                ])
            );
        }
    );

    return {
        restorableConfigs,
        chartIconAndFriendlyNameByRestorableConfigIndex
    };
})();
