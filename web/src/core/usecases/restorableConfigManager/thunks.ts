import { formFieldsValueToObject } from "core/usecases/launcher/FormField";
import { allEquals } from "evt/tools/reducers/allEquals";
import { same } from "evt/tools/inDepth/same";
import { assert, type Equals } from "tsafe/assert";
import type { Thunks } from "core/bootstrap";
import * as projectConfigs from "core/usecases/projectConfigs";
import { createUsecaseContextApi } from "redux-clean-architecture";
import { Chart } from "core/ports/OnyxiaApi";
import { Mutex } from "async-mutex";
import {
    name,
    actions,
    type ChartIconUrlByChartNameAndCatalogId,
    type RestorableConfig
} from "./state";
import { readFriendlyName } from "./selectors";

export const protectedThunks = {
    "initialize":
        () =>
        async (...args) => {
            const [dispatch, , { onyxiaApi, evtAction }] = args;

            const prRestorableConfigs = dispatch(
                privateThunks.getRemoteRestorableConfigs()
            );

            evtAction.attach(
                action =>
                    action.usecaseName === "projectConfigs" &&
                    action.actionName === "projectChanged",
                async () => {
                    //Making sure we are initialized
                    await prRestorableConfigs;

                    dispatch(
                        actions.restorableConfigsUpdated({
                            "restorableConfigs": []
                        })
                    );

                    dispatch(
                        actions.restorableConfigsUpdated({
                            "restorableConfigs": await dispatch(
                                privateThunks.getRemoteRestorableConfigs()
                            )
                        })
                    );
                }
            );

            dispatch(
                actions.initializationCompleted({
                    "restorableConfigs": await prRestorableConfigs
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

            const { restorableConfigs } = getState()[name];

            return (
                restorableConfigs.find(restorableConfig_i =>
                    getAreSameRestorableConfig(restorableConfig_i, restorableConfig)
                ) !== undefined
            );
        }
} satisfies Thunks;

const { getContext } = createUsecaseContextApi(() => ({
    "mutex": new Mutex()
}));

const privateThunks = {
    "getRemoteRestorableConfigs":
        () =>
        async (...args): Promise<RestorableConfig[]> => {
            const [dispatch] = args;

            const restorableConfigsStr = await dispatch(
                projectConfigs.protectedThunks.getConfigValue({
                    "key": "restorableConfigsStr"
                })
            );

            return restorableConfigsStr === null ? [] : JSON.parse(restorableConfigsStr);
        },
    "updateRemoteAndLocalStore":
        (params: {
            getNewRestorableConfigs: () => {
                newRestorableConfigs: RestorableConfig[] | undefined;
            };
        }) =>
        async (...args) => {
            const [dispatch, getState, rootContext] = args;

            const { getNewRestorableConfigs } = params;

            const { mutex } = getContext(rootContext);

            await mutex.runExclusive(async () => {
                {
                    const currentRemoteRestorableConfigs = await dispatch(
                        privateThunks.getRemoteRestorableConfigs()
                    );

                    const currentLocalRestorableConfigs =
                        getState()[name].restorableConfigs;

                    if (
                        !same(
                            currentRemoteRestorableConfigs,
                            currentLocalRestorableConfigs
                        )
                    ) {
                        alert(
                            [
                                "Another project member has updated the restorable",
                                "configs, can't save, please refresh the page and try again."
                            ].join(" ")
                        );
                        return;
                    }
                }

                const { newRestorableConfigs } = getNewRestorableConfigs();

                if (newRestorableConfigs === undefined) {
                    return undefined;
                }

                await dispatch(
                    projectConfigs.protectedThunks.changeConfigValue({
                        "key": "restorableConfigsStr",
                        "value": JSON.stringify(newRestorableConfigs)
                    })
                );

                dispatch(
                    actions.restorableConfigsUpdated({
                        "restorableConfigs": newRestorableConfigs
                    })
                );
            });
        }
} satisfies Thunks;

export const thunks = {
    "saveRestorableConfig":
        (params: { restorableConfig: RestorableConfig }) =>
        async (...args) => {
            const [dispatch, getState] = args;

            const { restorableConfig } = params;

            await dispatch(
                privateThunks.updateRemoteAndLocalStore({
                    "getNewRestorableConfigs": () => {
                        const { restorableConfigs } = getState()[name];

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
                            return { "newRestorableConfigs": undefined };
                        }

                        const newRestorableConfigs =
                            restorableConfigWithSameFriendlyName === undefined
                                ? [...restorableConfigs, restorableConfig]
                                : restorableConfigs.map(restorableConfig_i =>
                                      restorableConfig_i ===
                                      restorableConfigWithSameFriendlyName
                                          ? restorableConfig
                                          : restorableConfig_i
                                  );

                        return { newRestorableConfigs };
                    }
                })
            );
        },
    "deleteRestorableConfig":
        (params: { restorableConfig: RestorableConfig }) =>
        async (...args) => {
            const [dispatch, getState] = args;

            const { restorableConfig } = params;

            await dispatch(
                privateThunks.updateRemoteAndLocalStore({
                    "getNewRestorableConfigs": () => {
                        const { restorableConfigs } = getState()[name];

                        const indexOfRestorableConfigToDelete =
                            restorableConfigs.findIndex(restorableConfig_i =>
                                getAreSameRestorableConfig(
                                    restorableConfig_i,
                                    restorableConfig
                                )
                            );

                        // NOTE: In case of double call, as we don't provide a "loading state"
                        if (indexOfRestorableConfigToDelete === -1) {
                            return { "newRestorableConfigs": undefined };
                        }

                        const newRestorableConfigs = restorableConfigs.filter(
                            (_, index) => index !== indexOfRestorableConfigToDelete
                        );

                        return { newRestorableConfigs };
                    }
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
