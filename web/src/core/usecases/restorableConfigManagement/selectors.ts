import { createSelector } from "clean-architecture";
import type { State as RootState } from "core/bootstrap";
import { name } from "./state";
import { same } from "evt/tools/inDepth/same";
import { assert } from "tsafe/assert";
import { onyxiaFriendlyNameFormFieldPath } from "core/ports/OnyxiaApi";
import * as projectManagement from "core/usecases/projectManagement";

function state(rootState: RootState) {
    return rootState[name];
}

const restorableConfigs = createSelector(
    projectManagement.protectedSelectors.currentProjectConfigs,
    ({ restorableConfigs }) => [...restorableConfigs].reverse()
);

export function readFriendlyName(
    restorableConfig: projectManagement.ProjectConfigs.RestorableServiceConfig
): string {
    const userSetFriendlyName = restorableConfig.formFieldsValueDifferentFromDefault.find(
        ({ path }) => same(path, onyxiaFriendlyNameFormFieldPath.split("."))
    )?.value;
    assert(userSetFriendlyName === undefined || typeof userSetFriendlyName === "string");
    return userSetFriendlyName ?? restorableConfig.chartName;
}

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
                        chartIconUrlByChartNameAndCatalogId[restorableConfig.catalogId]?.[
                            restorableConfig.chartName
                        ],
                    "friendlyName": readFriendlyName(restorableConfig)
                }
            ])
        );
    }
);

const main = createSelector(
    restorableConfigs,
    chartIconAndFriendlyNameByRestorableConfigIndex,
    (restorableConfigs, chartIconAndFriendlyNameByRestorableConfigIndex) => ({
        restorableConfigs,
        chartIconAndFriendlyNameByRestorableConfigIndex
    })
);

export const protectedSelectors = {
    restorableConfigs,
    chartIconAndFriendlyNameByRestorableConfigIndex
};

export const selectors = {
    main
};
