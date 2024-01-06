import { createSelector } from "redux-clean-architecture";
import * as projectManagement from "core/usecases/projectManagement";
import * as deploymentRegionManagement from "core/usecases/deploymentRegionManagement";
import * as userAuthentication from "core/usecases/userAuthentication";
import { assert, type Equals } from "tsafe/assert";

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

const customS3Configs = createSelector(projectS3Config, projectS3Config =>
    projectS3Config.customConfigs
        .map((customS3Config, i) => ({
            "id": i,
            ...customS3Config,
            "isUsedForXOnyxia": projectS3Config.indexForXOnyxia === i,
            "isUsedForExplorer": projectS3Config.indexForExplorer === i
        }))
        .reverse()
);

const stsS3Config = createSelector(
    deploymentRegionManagement.selectors.currentDeploymentRegion,
    projectManagement.selectors.currentProject,
    userAuthentication.selectors.user,
    projectS3Config,
    (deploymentRegion, project, user, projectS3Config) => {
        if (deploymentRegion.s3?.sts === undefined) {
            return undefined;
        }

        return {
            "url": deploymentRegion.s3.url,
            "region": deploymentRegion.s3.region ?? "",
            "workingDirectoryPath": ((): string => {
                const { workingDirectory } = deploymentRegion.s3;

                switch (workingDirectory.bucketMode) {
                    case "multi":
                        return project.group === undefined
                            ? `${workingDirectory.bucketNamePrefix}${user.username}`
                            : `${workingDirectory.bucketNamePrefixGroup}${project.group}`;
                    case "shared":
                        return [
                            workingDirectory.bucketName,
                            project.group === undefined
                                ? `${workingDirectory.prefix}${user.username}`
                                : `${workingDirectory.prefixGroup}${project.group}`
                        ].join("/");
                }
                assert<Equals<typeof workingDirectory, never>>(true);
            })()
                .trim()
                .replace(/\/\//g, "/") // Remove double slashes if any
                .replace(/^\//g, "") // Ensure no leading slash
                .replace(/\/?$/g, "/"), // Enforce trailing slash
            "pathStyleAccess": deploymentRegion.s3.pathStyleAccess,
            "isUsedForXOnyxia": projectS3Config.indexForXOnyxia === undefined,
            "isUsedForExplorer": projectS3Config.indexForExplorer === undefined
        };
    }
);

const newCustomConfigDefaultValues = createSelector(stsS3Config, stsS3Config => ({
    "url": stsS3Config?.url ?? "",
    "region": stsS3Config?.region ?? "",
    "workingDirectoryPath": stsS3Config?.workingDirectoryPath ?? "",
    "pathStyleAccess": stsS3Config?.pathStyleAccess ?? false,
    "isUsedForXOnyxia": stsS3Config === undefined,
    "isUsedForExplorer": stsS3Config === undefined
}));

const main = createSelector(
    stsS3Config,
    customS3Configs,
    newCustomConfigDefaultValues,
    (stsS3Config, customS3Configs, newCustomConfigDefaultValues) => ({
        stsS3Config,
        customS3Configs,
        newCustomConfigDefaultValues
    })
);

export const protectedSelectors = {
    customS3ConfigForXOnyxia,
    customS3ConfigForExplorer,
    stsS3Config
};

export const selectors = { main };
