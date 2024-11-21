import { createSelector } from "clean-architecture";
import type { State as RootState } from "core/bootstrap";
import { name } from "./state";
import * as projectManagement from "core/usecases/projectManagement";

export type RestorableServiceConfig =
    projectManagement.ProjectConfigs.RestorableServiceConfig;

function state(rootState: RootState) {
    return rootState[name];
}

const restorableConfigs = createSelector(
    projectManagement.protectedSelectors.projectConfig,
    ({ restorableConfigs }) => [...restorableConfigs].reverse()
);

const chartIconUrlByRestorableConfigIndex = createSelector(
    state,
    restorableConfigs,
    (state, restorableConfigs): Record<number, string | undefined> => {
        const { indexedChartsIcons } = state;

        const chartIconUrlByRestorableConfigIndex = Object.fromEntries(
            restorableConfigs.map((restorableConfig, restorableConfigIndex) => [
                restorableConfigIndex,
                indexedChartsIcons[restorableConfig.catalogId]?.[
                    restorableConfig.chartName
                ]
            ])
        );

        return chartIconUrlByRestorableConfigIndex;
    }
);

const main = createSelector(
    restorableConfigs,
    chartIconUrlByRestorableConfigIndex,
    (restorableConfigs, chartIconUrlByRestorableConfigIndex) => ({
        restorableConfigs,
        chartIconUrlByRestorableConfigIndex
    })
);

export const protectedSelectors = {
    restorableConfigs,
    chartIconUrlByRestorableConfigIndex
};

export const selectors = {
    main
};
