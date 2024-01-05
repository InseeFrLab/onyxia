import { createSelector } from "redux-clean-architecture";
import * as projectManagement from "core/usecases/projectManagement";
import { assert } from "tsafe/assert";

const customS3Configs = createSelector(
    projectManagement.protectedSelectors.currentProjectConfigs,
    currentProjectConfigs => currentProjectConfigs.customS3Configs
);

const customS3ConfigForXOnyxia = createSelector(customS3Configs, customS3Configs => {
    if (customS3Configs.indexForXOnyxia === undefined) {
        return undefined;
    }
    const customS3Config =
        customS3Configs.availableConfigs[customS3Configs.indexForXOnyxia];

    assert(customS3Config !== undefined);

    return customS3Config;
});

const customS3ConfigForExplorer = createSelector(customS3Configs, customS3Configs => {
    if (customS3Configs.indexForExplorer === undefined) {
        return undefined;
    }

    const customS3Config =
        customS3Configs.availableConfigs[customS3Configs.indexForExplorer];

    assert(customS3Config !== undefined);

    return customS3Config;
});

export const protectedSelectors = {
    customS3ConfigForXOnyxia,
    customS3ConfigForExplorer
};
