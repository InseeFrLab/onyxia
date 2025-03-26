import { createSelector } from "clean-architecture";
import type { State as RootState } from "core/bootstrap";
import { name } from "./state";
import * as projectManagement from "core/usecases/projectManagement";

function state(rootState: RootState) {
    return rootState[name];
}

const restorableConfigs = createSelector(
    projectManagement.protectedSelectors.projectConfig,
    createSelector(state, state => state.indexedChartsIcons),
    ({ restorableConfigs }, indexedChartsIcons) =>
        restorableConfigs.map(restorableConfig => ({
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
