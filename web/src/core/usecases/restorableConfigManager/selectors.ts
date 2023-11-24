import { createSelector } from "redux-clean-architecture";
import type { State as RootState } from "core/bootstrap";
import { name, type RestorableConfig } from "./state";
import { same } from "evt/tools/inDepth/same";
import { assert } from "tsafe/assert";
import { onyxiaFriendlyNameFormFieldPath } from "core/ports/OnyxiaApi";

function state(rootState: RootState) {
    return rootState[name];
}

const restorableConfigs = createSelector(state, state =>
    [...state.restorableConfigs].reverse()
);

export function readFriendlyName(restorableConfig: RestorableConfig): string {
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
                        chartIconUrlByChartNameAndCatalogId === undefined
                            ? undefined
                            : chartIconUrlByChartNameAndCatalogId[
                                  restorableConfig.catalogId
                              ]?.[restorableConfig.chartName],
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

const savedConfigFriendlyNames = createSelector(
    chartIconAndFriendlyNameByRestorableConfigIndex,
    chartIconAndFriendlyNameByRestorableConfigIndex =>
        Object.values(chartIconAndFriendlyNameByRestorableConfigIndex).map(
            ({ friendlyName }) => friendlyName
        )
);

export const protectedSelectors = {
    restorableConfigs,
    savedConfigFriendlyNames
};

export const selectors = {
    main
};
