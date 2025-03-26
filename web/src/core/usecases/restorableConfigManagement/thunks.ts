import { assert } from "tsafe/assert";
import type { Thunks } from "core/bootstrap";
import * as projectManagement from "core/usecases/projectManagement";
import { actions, type State } from "./state";
import { getAreSameRestorableConfig } from "./decoupledLogic/getAreSameRestorableConfig";

export const protectedThunks = {
    initialize:
        () =>
        (...args) => {
            const [dispatch, , { onyxiaApi }] = args;

            // NOTE: We don't want to block the initialization
            // we can proceed to fetch the icons in parallel.
            (async () => {
                const { catalogs, chartsByCatalogId } =
                    await onyxiaApi.getCatalogsAndCharts();

                const indexedChartsIcons: State["indexedChartsIcons"] = {};

                catalogs.forEach(({ id: catalogId }) =>
                    chartsByCatalogId[catalogId].forEach(chart => {
                        (indexedChartsIcons[catalogId] ??= {})[chart.name] =
                            chart.iconUrl;
                    })
                );

                dispatch(actions.initialized({ indexedChartsIcons }));
            })();
        }
} satisfies Thunks;

type RestorableServiceConfigLike = {
    friendlyName: string;
    catalogId: string;
    chartName: string;
};

export const thunks = {
    saveRestorableConfig:
        (params: {
            restorableConfig: projectManagement.ProjectConfigs.RestorableServiceConfig;
        }) =>
        async (...args) => {
            const [dispatch, getState] = args;

            const { restorableConfig } = params;

            const { restorableConfigs } =
                projectManagement.protectedSelectors.projectConfig(getState());

            const restorableConfigWithSameFriendlyNameAndSameService = (() => {
                const results = restorableConfigs.filter(
                    restorableConfig_i =>
                        restorableConfig_i.friendlyName ===
                            restorableConfig.friendlyName &&
                        restorableConfig_i.catalogId === restorableConfig.catalogId &&
                        restorableConfig_i.chartName === restorableConfig.chartName
                );

                if (results.length === 0) {
                    return undefined;
                }

                assert(results.length === 1);

                return results[0];
            })();

            // NOTE: In case of double call, as we don't provide a "loading state"
            if (
                restorableConfigWithSameFriendlyNameAndSameService !== undefined &&
                getAreSameRestorableConfig(
                    restorableConfig,
                    restorableConfigWithSameFriendlyNameAndSameService
                )
            ) {
                return;
            }

            const newRestorableConfigs =
                restorableConfigWithSameFriendlyNameAndSameService === undefined
                    ? [...restorableConfigs, restorableConfig]
                    : restorableConfigs.map(restorableConfig_i =>
                          restorableConfig_i ===
                          restorableConfigWithSameFriendlyNameAndSameService
                              ? restorableConfig
                              : restorableConfig_i
                      );

            await dispatch(
                projectManagement.protectedThunks.updateConfigValue({
                    key: "restorableConfigs",
                    value: newRestorableConfigs
                })
            );
        },
    deleteRestorableConfig:
        (params: { restorableConfig: RestorableServiceConfigLike }) =>
        async (...args) => {
            const [dispatch, getState] = args;

            const { restorableConfig } = params;

            const { restorableConfigs } =
                projectManagement.protectedSelectors.projectConfig(getState());

            const indexOfRestorableConfigToDelete = restorableConfigs.findIndex(
                restorableConfig_i =>
                    restorableConfig_i.friendlyName === restorableConfig.friendlyName &&
                    restorableConfig_i.catalogId === restorableConfig.catalogId &&
                    restorableConfig_i.chartName === restorableConfig.chartName
            );

            // NOTE: In case of double call, as we don't provide a "loading state"
            if (indexOfRestorableConfigToDelete === -1) {
                return;
            }

            const newRestorableConfigs = restorableConfigs.filter(
                (_, index) => index !== indexOfRestorableConfigToDelete
            );

            await dispatch(
                projectManagement.protectedThunks.updateConfigValue({
                    key: "restorableConfigs",
                    value: newRestorableConfigs
                })
            );
        },
    reorderRestorableConfigs:
        (params: { restorableServiceConfigId: string; targetIndex: number }) =>
        async (...args) => {
            const [dispatch, getState] = args;

            const { restorableServiceConfigId, targetIndex } = params;

            const { restorableConfigs } =
                projectManagement.protectedSelectors.projectConfig(getState());

            const currentIndex = restorableConfigs.findIndex(
                restorableConfig =>
                    restorableConfig.restorableServiceConfigId ===
                    restorableServiceConfigId
            );

            assert(currentIndex !== -1);

            if (currentIndex === targetIndex) {
                return;
            }

            const restorableConfigs_new = [...restorableConfigs];

            const restorableConfig = restorableConfigs[currentIndex];

            restorableConfigs_new.splice(currentIndex, 1);
            restorableConfigs_new.splice(targetIndex, 0, restorableConfig);

            await dispatch(
                projectManagement.protectedThunks.updateConfigValue({
                    key: "restorableConfigs",
                    value: restorableConfigs_new
                })
            );
        }
} satisfies Thunks;
