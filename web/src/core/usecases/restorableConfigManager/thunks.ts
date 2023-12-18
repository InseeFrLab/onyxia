import { formFieldsValueToObject } from "core/usecases/launcher/FormField";
import { allEquals } from "evt/tools/reducers/allEquals";
import { same } from "evt/tools/inDepth/same";
import { assert, type Equals } from "tsafe/assert";
import type { Thunks } from "core/bootstrap";
import * as projectConfigs from "core/usecases/projectConfigs";
import { Chart } from "core/ports/OnyxiaApi";
import { actions, type State, type RestorableConfig } from "./state";
import { readFriendlyName, protectedSelectors } from "./selectors";

export const protectedThunks = {
    "initialize":
        () =>
        async (...args) => {
            const [dispatch, , { onyxiaApi }] = args;

            // NOTE: We don't want to block the initialization
            // we can proceed to fetch the icons in parallel.
            (async () => {
                const { catalogs, chartsByCatalogId } =
                    await onyxiaApi.getCatalogsAndCharts();

                const chartIconUrlByChartNameAndCatalogId: State.ChartIconUrlByChartNameAndCatalogId =
                    {};

                catalogs.forEach(({ id: catalogId }) => {
                    const chartIconUrlByChartName: State.ChartIconUrlByChartNameAndCatalogId[string] =
                        {};

                    chartsByCatalogId[catalogId].forEach(chart => {
                        const defaultVersion = Chart.getDefaultVersion(chart);

                        chartIconUrlByChartName[chart.name] = chart.versions.find(
                            ({ version }) => version === defaultVersion
                        )!.iconUrl;
                    });

                    chartIconUrlByChartNameAndCatalogId[catalogId] =
                        chartIconUrlByChartName;
                });

                dispatch(
                    actions.chartIconsFetched({ chartIconUrlByChartNameAndCatalogId })
                );
            })();
        },
    "getIsRestorableConfigSaved":
        (params: { restorableConfig: RestorableConfig }) =>
        (...args): boolean => {
            const [, getState] = args;

            const { restorableConfig } = params;

            const restorableConfigs = protectedSelectors.restorableConfigs(getState());

            return (
                restorableConfigs.find(restorableConfig_i =>
                    getAreSameRestorableConfig(restorableConfig_i, restorableConfig)
                ) !== undefined
            );
        }
} satisfies Thunks;

export const thunks = {
    "saveRestorableConfig":
        (params: { restorableConfig: RestorableConfig }) =>
        async (...args) => {
            const [dispatch, getState] = args;

            const { restorableConfig } = params;

            const restorableConfigs = protectedSelectors.restorableConfigs(getState());

            const restorableConfigWithSameFriendlyName = (() => {
                const results = restorableConfigs.filter(
                    restorableConfig_i =>
                        readFriendlyName(restorableConfig_i) ===
                        readFriendlyName(restorableConfig)
                );

                if (results.length === 0) {
                    return undefined;
                }

                assert(results.length === 1);

                return results[0];
            })();

            // NOTE: In case of double call, as we don't provide a "loading state"
            if (
                restorableConfigWithSameFriendlyName !== undefined &&
                getAreSameRestorableConfig(
                    restorableConfig,
                    restorableConfigWithSameFriendlyName
                )
            ) {
                return;
            }

            const newRestorableConfigs =
                restorableConfigWithSameFriendlyName === undefined
                    ? [...restorableConfigs, restorableConfig]
                    : restorableConfigs.map(restorableConfig_i =>
                          restorableConfig_i === restorableConfigWithSameFriendlyName
                              ? restorableConfig
                              : restorableConfig_i
                      );

            await dispatch(
                projectConfigs.protectedThunks.updateValue({
                    "key": "restorableConfigs",
                    "value": newRestorableConfigs
                })
            );
        },
    "deleteRestorableConfig":
        (params: { restorableConfig: RestorableConfig }) =>
        async (...args) => {
            const [dispatch, getState] = args;

            const { restorableConfig } = params;

            const restorableConfigs = protectedSelectors.restorableConfigs(getState());

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
                projectConfigs.protectedThunks.updateValue({
                    "key": "restorableConfigs",
                    "value": newRestorableConfigs
                })
            );
        }
} satisfies Thunks;

export function getAreSameRestorableConfig(
    restorableConfiguration1: RestorableConfig,
    restorableConfiguration2: RestorableConfig
): boolean {
    return [restorableConfiguration1, restorableConfiguration2]
        .map(
            ({
                catalogId,
                chartName,
                chartVersion,
                formFieldsValueDifferentFromDefault,
                ...rest
            }) => {
                assert<Equals<typeof rest, {}>>();

                return [
                    catalogId,
                    chartName,
                    chartVersion,
                    formFieldsValueToObject(formFieldsValueDifferentFromDefault)
                ];
            }
        )
        .reduce(...allEquals(same));
}
