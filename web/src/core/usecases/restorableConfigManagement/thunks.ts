import { assert } from "tsafe/assert";
import type { Thunks } from "core/bootstrap";
import * as projectManagement from "core/usecases/projectManagement";
import { actions, type State } from "./state";
import { getAreSameRestorableConfig } from "./decoupledLogic/getAreSameRestorableConfig";
// NOTE: Polyfill of a browser feature.
import structuredClone from "@ungap/structured-clone";
import {
    getAreSameRestorableConfigRef,
    type RestorableServiceConfigRef
} from "./decoupledLogic/getAreSameRestorableConfigRef";

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

            const restorableConfig_withSameRef = (() => {
                const results = restorableConfigs.filter(restorableConfig_i =>
                    getAreSameRestorableConfigRef(restorableConfig_i, restorableConfig)
                );

                if (results.length === 0) {
                    return undefined;
                }

                assert(results.length === 1);

                return results[0];
            })();

            // NOTE: In case of double call, as we don't provide a "loading state"
            if (
                restorableConfig_withSameRef !== undefined &&
                getAreSameRestorableConfig(restorableConfig, restorableConfig_withSameRef)
            ) {
                return;
            }

            const restorableConfigs_new = [...restorableConfigs];

            if (restorableConfig_withSameRef === undefined) {
                restorableConfigs_new.unshift(restorableConfig);
            } else {
                const i = restorableConfigs.indexOf(restorableConfig_withSameRef);

                assert(i !== -1);

                restorableConfigs_new[i] = restorableConfig;
            }

            await dispatch(
                projectManagement.protectedThunks.updateConfigValue({
                    key: "restorableConfigs",
                    value: restorableConfigs_new
                })
            );
        },
    deleteRestorableConfig:
        (params: { restorableConfigRef: RestorableServiceConfigRef }) =>
        async (...args) => {
            const [dispatch, getState] = args;

            const { restorableConfigRef: ref } = params;

            const { restorableConfigs } =
                projectManagement.protectedSelectors.projectConfig(getState());

            const index_toDelete = restorableConfigs.findIndex(c =>
                getAreSameRestorableConfigRef(c, ref)
            );

            // NOTE: In case of double call, as we don't provide a "loading state"
            if (index_toDelete === -1) {
                return;
            }

            const restorableConfigs_new = restorableConfigs.filter(
                (_, index) => index !== index_toDelete
            );

            await dispatch(
                projectManagement.protectedThunks.updateConfigValue({
                    key: "restorableConfigs",
                    value: restorableConfigs_new
                })
            );
        },
    reorderRestorableConfigs:
        (params: {
            restorableConfigRef: RestorableServiceConfigRef;
            targetIndex: number;
        }) =>
        async (...args) => {
            const [dispatch, getState] = args;

            const { restorableConfigRef: ref, targetIndex } = params;

            const { restorableConfigs } =
                projectManagement.protectedSelectors.projectConfig(getState());

            const index_current = restorableConfigs.findIndex(c =>
                getAreSameRestorableConfigRef(c, ref)
            );

            assert(index_current !== -1);

            if (index_current === targetIndex) {
                return;
            }

            const restorableConfigs_new = [...restorableConfigs];

            const restorableConfig = restorableConfigs[index_current];

            restorableConfigs_new.splice(index_current, 1);
            restorableConfigs_new.splice(targetIndex, 0, restorableConfig);

            await dispatch(
                projectManagement.protectedThunks.updateConfigValue({
                    key: "restorableConfigs",
                    value: restorableConfigs_new
                })
            );
        },
    renameRestorableConfig:
        (params: {
            restorableConfigRef: RestorableServiceConfigRef;
            newFriendlyName: string;
        }) =>
        async (...args) => {
            const [dispatch, getState] = args;

            const { restorableConfigRef: ref, newFriendlyName } = params;

            const { restorableConfigs } =
                projectManagement.protectedSelectors.projectConfig(getState());

            const restorableConfig_current = restorableConfigs.find(c =>
                getAreSameRestorableConfigRef(c, ref)
            );

            assert(restorableConfig_current !== undefined);

            if (restorableConfig_current.friendlyName === newFriendlyName) {
                return;
            }

            const index = restorableConfigs.indexOf(restorableConfig_current);

            assert(index !== -1);

            const restorableConfigs_new = [...restorableConfigs];

            const restorableConfig_new = structuredClone(restorableConfig_current);

            restorableConfig_new.friendlyName = newFriendlyName;

            restorableConfigs_new[index] = restorableConfig_new;

            await dispatch(
                projectManagement.protectedThunks.updateConfigValue({
                    key: "restorableConfigs",
                    value: restorableConfigs_new
                })
            );
        }
} satisfies Thunks;
