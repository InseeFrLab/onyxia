import { createSelector } from "clean-architecture";
import type { State as RootState } from "core/bootstrap";
import { name } from "./state";
import * as projectManagement from "core/usecases/projectManagement";

const state = (rootState: RootState) => rootState[name];

const restorableConfigs = createSelector(
    projectManagement.protectedSelectors.projectConfig,
    createSelector(state, state => state.indexedChartsIcons),
    ({ restorableServiceConfigs }, indexedChartsIcons) =>
        restorableServiceConfigs.map(restorableConfig => ({
            ...restorableConfig,
            chartIconUrl:
                indexedChartsIcons[restorableConfig.catalogId]?.[
                    restorableConfig.chartName
                ]
        }))
);

export const selectors = {
    restorableConfigs
};
