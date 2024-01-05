import { createSelector } from "redux-clean-architecture";
import * as projectManagement from "core/usecases/projectManagement";
import { assert } from "tsafe/assert";

const projectS3Config = createSelector(
    projectManagement.protectedSelectors.currentProjectConfigs,
    currentProjectConfigs => currentProjectConfigs.s3
);

const customS3ConfigForXOnyxia = createSelector(projectS3Config, projectS3Config => {
    if (projectS3Config.indexForXOnyxia === undefined) {
        return undefined;
    }
    const customS3Config = projectS3Config.customConfigs[projectS3Config.indexForXOnyxia];

    assert(customS3Config !== undefined);

    return customS3Config;
});

const customS3ConfigForExplorer = createSelector(projectS3Config, projectS3Config => {
    if (projectS3Config.indexForExplorer === undefined) {
        return undefined;
    }

    const customS3Config =
        projectS3Config.customConfigs[projectS3Config.indexForExplorer];

    assert(customS3Config !== undefined);

    return customS3Config;
});

/*
type CustomS3Config = {
    url: string;
    region: string;
    workingDirectoryPath: string;
    pathStyleAccess: boolean;
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken: string | undefined;
    isUsedForXOnyxia: boolean;
    isUsedForExplorer: boolean;
};
*/

export const protectedSelectors = {
    customS3ConfigForXOnyxia,
    customS3ConfigForExplorer
};
