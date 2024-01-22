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

const baseS3Config = createSelector(
    deploymentRegionManagement.selectors.currentDeploymentRegion,
    projectManagement.selectors.currentProject,
    userAuthentication.selectors.user,
    (deploymentRegion, project, user) => {
        return {
            "url": deploymentRegion.s3?.url ?? "",
            "region": deploymentRegion.s3?.region ?? "",
            "workingDirectoryPath": ((): string => {
                const { workingDirectory } = deploymentRegion.s3 ?? {};

                if (workingDirectory === undefined) {
                    return "";
                }

                // NOTE: This is the case when no workingDirectory is set in the config.
                if (
                    workingDirectory.bucketMode === "shared" &&
                    workingDirectory.bucketName === ""
                ) {
                    return "";
                }

                return (
                    (() => {
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
                        .replace(/\/+$/g, "") + "/"
                ); // Enforce trailing slash
            })(),
            "pathStyleAccess": deploymentRegion.s3?.pathStyleAccess ?? true
        };
    }
);

const s3Configs = createSelector(
    baseS3Config,
    projectS3Config,
    deploymentRegionManagement.selectors.currentDeploymentRegion,
    (baseS3Config, projectS3Config, deploymentRegion) => {
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

        const s3Configs = projectS3Config.customConfigs.map((customS3Config, index) => ({
            "customConfigIndex": id<number | undefined>(index),
            "dataSource": getDataSource({
                "url": customS3Config.url,
                "pathStyleAccess": customS3Config.pathStyleAccess,
                "workingDirectoryPath": customS3Config.workingDirectoryPath
            }),
            "region": customS3Config.region,
            "accountFriendlyName": id<string | undefined>(
                customS3Config.accountFriendlyName
            ),
            "isUsedForXOnyxia": projectS3Config.indexForXOnyxia === index,
            "isUsedForExplorer": projectS3Config.indexForExplorer === index
        }));

        if (deploymentRegion.s3?.sts !== undefined) {
            s3Configs.unshift({
                "customConfigIndex": undefined,
                "dataSource": getDataSource({
                    "url": baseS3Config.url,
                    "pathStyleAccess": baseS3Config.pathStyleAccess,
                    "workingDirectoryPath": baseS3Config.workingDirectoryPath
                }),
                "region": baseS3Config.region,
                "accountFriendlyName": undefined,
                "isUsedForXOnyxia":
                    s3Configs.find(({ isUsedForXOnyxia }) => isUsedForXOnyxia) ===
                    undefined,
                "isUsedForExplorer":
                    s3Configs.find(({ isUsedForExplorer }) => isUsedForExplorer) ===
                    undefined
            });
        }

        return s3Configs;
    }
);

export const protectedSelectors = {
    projectS3Config,
    baseS3Config
};

export const selectors = { s3Configs };
