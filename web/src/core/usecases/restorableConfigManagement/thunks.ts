import { formFieldsValueToObject } from "core/usecases/launcher/FormField";
import { allEquals } from "evt/tools/reducers/allEquals";
import { same } from "evt/tools/inDepth/same";
import { assert, type Equals } from "tsafe/assert";
import type { Thunks } from "core/bootstrap";
import * as projectManagement from "core/usecases/projectManagement";
import { actions, type State } from "./state";

export const protectedThunks = {
    "initialize":
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
                    chartsByCatalogId[catalogId].forEach(chart =>
                        chart.versions.find(
                            version =>
                                (((indexedChartsIcons[catalogId] ??= {})[chart.name] ??=
                                    {})[version.version] = version.iconUrl)
                        )
                    )
                );

                dispatch(actions.initialized({ indexedChartsIcons }));
            })();
        },
    "getIsRestorableConfigSaved":
        (params: {
            restorableConfig: projectManagement.ProjectConfigs.RestorableServiceConfig;
        }) =>
        (...args): boolean => {
            const [, getState] = args;

            const { restorableConfig } = params;

            const { restorableConfigs } =
                projectManagement.protectedSelectors.currentProjectConfigs(getState());

            return (
                restorableConfigs.find(restorableConfig_i =>
                    getAreSameRestorableConfig(restorableConfig_i, restorableConfig)
                ) !== undefined
            );
        }
} satisfies Thunks;

export const thunks = {
    "saveRestorableConfig":
        (params: {
            restorableConfig: projectManagement.ProjectConfigs.RestorableServiceConfig;
        }) =>
        async (...args) => {
            const [dispatch, getState] = args;

            const { restorableConfig } = params;

            const { restorableConfigs } =
                projectManagement.protectedSelectors.currentProjectConfigs(getState());

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
                    "key": "restorableConfigs",
                    "value": newRestorableConfigs
                })
            );
        },
    "deleteRestorableConfig":
        (params: {
            restorableConfig: projectManagement.ProjectConfigs.RestorableServiceConfig;
        }) =>
        async (...args) => {
            const [dispatch, getState] = args;

            const { restorableConfig } = params;

            const { restorableConfigs } =
                projectManagement.protectedSelectors.currentProjectConfigs(getState());

            const indexOfRestorableConfigToDelete = restorableConfigs.findIndex(
                restorableConfig_i =>
                    getAreSameRestorableConfig(restorableConfig_i, restorableConfig)
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
                    "key": "restorableConfigs",
                    "value": newRestorableConfigs
                })
            );
        }
} satisfies Thunks;

export function getAreSameRestorableConfig(
    restorableConfiguration1: projectManagement.ProjectConfigs.RestorableServiceConfig,
    restorableConfiguration2: projectManagement.ProjectConfigs.RestorableServiceConfig
): boolean {
    return [restorableConfiguration1, restorableConfiguration2]
        .map(
            ({
                catalogId,
                chartName,
                chartVersion,
                friendlyName,
                isShared,
                formFieldsValueDifferentFromDefault,
                ...rest
            }) => {
                assert<Equals<typeof rest, {}>>();

                return [
                    catalogId,
                    chartName,
                    chartVersion,
                    friendlyName,
                    isShared,
                    formFieldsValueToObject(formFieldsValueDifferentFromDefault)
                ];
            }
        )
        .reduce(...allEquals(same));
}
