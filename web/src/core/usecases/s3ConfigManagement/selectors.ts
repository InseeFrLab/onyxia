import { createSelector } from "redux-clean-architecture";
import * as projectManagement from "core/usecases/projectManagement";
import * as deploymentRegionManagement from "core/usecases/deploymentRegionManagement";
import * as userAuthentication from "core/usecases/userAuthentication";
import { assert, type Equals } from "tsafe/assert";
import { bucketNameAndObjectNameFromS3Path } from "core/adapters/s3Client/utils/bucketNameAndObjectNameFromS3Path";
import { id } from "tsafe/id";

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
            "index": i,
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

const s3Configs = createSelector(
    stsS3Config,
    customS3Configs,
    (stsS3Config, customS3Configs) => {
        function getDataSource(params: {
            url: string;
            pathStyleAccess: boolean;
            workingDirectoryPath: string;
        }): string {
            const { url, pathStyleAccess, workingDirectoryPath } = params;

            let out = url;

            out = out.replace(/^https?:\/\//, "").replace(/\/$/, "");

            const { bucketName, objectName } =
                bucketNameAndObjectNameFromS3Path(workingDirectoryPath);

            out = pathStyleAccess
                ? `${out}/${bucketName}/${objectName}`
                : `${bucketName}.${out}/${objectName}`;

            return out;
        }

        const s3Configs = customS3Configs.map(customS3Config => ({
            "customConfigIndex": id<number | undefined>(customS3Config.index),
            "dataSource": getDataSource({
                "url": customS3Config.url,
                "pathStyleAccess": customS3Config.pathStyleAccess,
                "workingDirectoryPath": customS3Config.workingDirectoryPath
            }),
            "region": customS3Config.region,
            "accountFriendlyName": id<string | undefined>(
                customS3Config.accountFriendlyName
            ),
            "isUsedForXOnyxia": customS3Config.isUsedForXOnyxia,
            "isUsedForExplorer": customS3Config.isUsedForExplorer
        }));

        if (stsS3Config !== undefined) {
            s3Configs.unshift({
                "customConfigIndex": undefined,
                "dataSource": getDataSource({
                    "url": stsS3Config.url,
                    "pathStyleAccess": stsS3Config.pathStyleAccess,
                    "workingDirectoryPath": stsS3Config.workingDirectoryPath
                }),
                "region": stsS3Config.region,
                "accountFriendlyName": undefined,
                "isUsedForXOnyxia": stsS3Config.isUsedForXOnyxia,
                "isUsedForExplorer": stsS3Config.isUsedForExplorer
            });
        }

        return s3Configs;
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
    s3Configs,
    newCustomConfigDefaultValues,
    (s3Configs, newCustomConfigDefaultValues) => ({
        s3Configs,
        newCustomConfigDefaultValues
    })
);

export const protectedSelectors = {
    customS3ConfigForXOnyxia,
    customS3ConfigForExplorer,
    stsS3Config
};

export const selectors = { main };
