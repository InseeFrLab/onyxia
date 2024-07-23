import { createSelector } from "clean-architecture";
import * as projectManagement from "core/usecases/projectManagement";
import * as deploymentRegionManagement from "core/usecases/deploymentRegionManagement";
import * as userAuthentication from "core/usecases/userAuthentication";
import * as s3ConfigConnectionTest from "core/usecases/s3ConfigConnectionTest";
import { bucketNameAndObjectNameFromS3Path } from "core/adapters/s3Client/utils/bucketNameAndObjectNameFromS3Path";
import type { ParamsOfCreateS3Client } from "core/adapters/s3Client";
import { same } from "evt/tools/inDepth/same";
import { getWorkingDirectoryPath } from "./utils/getWorkingDirectoryPath";
import { getWorkingDirectoryBucketToCreate } from "./utils/getWorkingDirectoryBucket";
import { fnv1aHashToHex } from "core/tools/fnv1aHashToHex";
import { assert, type Equals } from "tsafe/assert";

export type S3Config = S3Config.FromDeploymentRegion | S3Config.FromProject;

export namespace S3Config {
    type Common = {
        id: string;
        dataSource: string;
        region: string | undefined;
        workingDirectoryPath: string;
        paramsOfCreateS3Client: ParamsOfCreateS3Client;
        isXOnyxiaDefault: boolean;
        isExplorerConfig: boolean;
        connectionTestStatus:
            | { status: "not tested" }
            | { status: "test ongoing" }
            | { status: "test failed"; errorMessage: string }
            | { status: "test succeeded" };
    };

    export type FromDeploymentRegion = Common & {
        origin: "deploymentRegion";
    };

    export type FromProject = Common & {
        origin: "project";
        creationTime: number;
        friendlyName: string;
    };
}

const s3Configs = createSelector(
    createSelector(
        projectManagement.protectedSelectors.projectConfig,
        projectConfig => projectConfig.s3Configs
    ),
    createSelector(
        projectManagement.protectedSelectors.projectConfig,
        projectConfig => projectConfig.s3ConfigId_defaultXOnyxia
    ),
    createSelector(
        projectManagement.protectedSelectors.projectConfig,
        projectConfig => projectConfig.s3ConfigId_explorer
    ),
    createSelector(
        deploymentRegionManagement.selectors.currentDeploymentRegion,
        deploymentRegion => deploymentRegion.s3Configs
    ),
    s3ConfigConnectionTest.protectedSelectors.configTestResults,
    s3ConfigConnectionTest.protectedSelectors.ongoingConfigTests,
    createSelector(userAuthentication.selectors.user, user => user.username),
    createSelector(
        projectManagement.protectedSelectors.currentProject,
        project => project.group
    ),
    (
        s3ProjectConfigs,
        s3ConfigId_defaultXOnyxia,
        s3ConfigId_explorer,
        s3RegionConfigs,
        configTestResults,
        ongoingConfigTests,
        username,
        projectGroup
    ): S3Config[] => {
        const getDataSource = (params: {
            url: string;
            pathStyleAccess: boolean;
            workingDirectoryPath: string;
        }): string => {
            const { url, pathStyleAccess, workingDirectoryPath } = params;

            let out = url;

            out = out.replace(/^https?:\/\//, "").replace(/\/$/, "");

            const { bucketName, objectName } =
                bucketNameAndObjectNameFromS3Path(workingDirectoryPath);

            out = pathStyleAccess
                ? `${out}/${bucketName}/${objectName}`
                : `${bucketName}.${out}/${objectName}`;

            return out;
        };

        const getConnectionTestStatus = (params: {
            workingDirectoryPath: string;
            paramsOfCreateS3Client: ParamsOfCreateS3Client;
        }): S3Config["connectionTestStatus"] => {
            const { workingDirectoryPath, paramsOfCreateS3Client } = params;

            if (
                ongoingConfigTests.find(
                    e =>
                        same(e.paramsOfCreateS3Client, paramsOfCreateS3Client) &&
                        e.workingDirectoryPath === workingDirectoryPath
                ) !== undefined
            ) {
                return { "status": "test ongoing" };
            }

            has_result: {
                const { result } =
                    configTestResults.find(
                        e =>
                            same(e.paramsOfCreateS3Client, paramsOfCreateS3Client) &&
                            e.workingDirectoryPath === workingDirectoryPath
                    ) ?? {};

                if (result === undefined) {
                    break has_result;
                }

                return result.isSuccess
                    ? { "status": "test succeeded" }
                    : { "status": "test failed", "errorMessage": result.errorMessage };
            }

            return { "status": "not tested" };
        };

        const s3Configs: S3Config[] = [
            ...s3ProjectConfigs
                .map((c): S3Config.FromProject => {
                    const id = `project-${c.creationTime}`;

                    const workingDirectoryPath = c.workingDirectoryPath;
                    const url = c.url;
                    const pathStyleAccess = c.pathStyleAccess;
                    const region = c.region;

                    const paramsOfCreateS3Client: ParamsOfCreateS3Client.NoSts = {
                        url,
                        pathStyleAccess,
                        isStsEnabled: false,
                        region,
                        credentials: c.credentials
                    };

                    return {
                        "origin": "project",
                        "creationTime": c.creationTime,
                        "friendlyName": c.friendlyName,
                        id,
                        "dataSource": getDataSource({
                            url,
                            pathStyleAccess,
                            workingDirectoryPath
                        }),
                        region,
                        workingDirectoryPath,
                        paramsOfCreateS3Client,
                        "isXOnyxiaDefault": false,
                        "isExplorerConfig": false,
                        "connectionTestStatus": getConnectionTestStatus({
                            paramsOfCreateS3Client,
                            workingDirectoryPath
                        })
                    };
                })
                .sort((a, b) => b.creationTime - a.creationTime),
            ...s3RegionConfigs.map((c): S3Config.FromDeploymentRegion => {
                const id = `region-${fnv1aHashToHex(
                    JSON.stringify(
                        Object.fromEntries(
                            Object.entries(c).sort(([key1], [key2]) =>
                                key1.localeCompare(key2)
                            )
                        )
                    )
                )}`;

                const workingDirectoryContext =
                    projectGroup === undefined
                        ? {
                              "type": "personalProject" as const,
                              username
                          }
                        : {
                              "type": "groupProject" as const,
                              projectGroup
                          };

                const workingDirectoryPath = getWorkingDirectoryPath({
                    "workingDirectory": c.workingDirectory,
                    "context": workingDirectoryContext
                });
                const url = c.url;
                const pathStyleAccess = c.pathStyleAccess;
                const region = c.region;

                const paramsOfCreateS3Client: ParamsOfCreateS3Client.Sts = {
                    url,
                    pathStyleAccess,
                    isStsEnabled: true,
                    stsUrl: c.sts.url,
                    region,
                    oidcParams: c.sts.oidcParams,
                    durationSeconds: c.sts.durationSeconds,
                    role: c.sts.role,
                    nameOfBucketToCreateIfNotExist: getWorkingDirectoryBucketToCreate({
                        "workingDirectory": c.workingDirectory,
                        "context": workingDirectoryContext
                    })
                };

                return {
                    "origin": "deploymentRegion",
                    id,
                    "dataSource": getDataSource({
                        url,
                        pathStyleAccess,
                        workingDirectoryPath
                    }),
                    region,
                    workingDirectoryPath,
                    paramsOfCreateS3Client,
                    "isXOnyxiaDefault": false,
                    "isExplorerConfig": false,
                    "connectionTestStatus": getConnectionTestStatus({
                        paramsOfCreateS3Client,
                        workingDirectoryPath
                    })
                };
            })
        ];

        (
            [
                ["defaultXOnyxia", s3ConfigId_defaultXOnyxia],
                ["explorer", s3ConfigId_explorer]
            ] as const
        ).forEach(([prop, s3ConfigId]) => {
            if (s3ConfigId === undefined) {
                return;
            }

            const s3Config =
                s3Configs.find(({ id }) => id === s3ConfigId) ??
                s3Configs.find(s3Config => s3Config.origin === "deploymentRegion");

            if (s3Config === undefined) {
                return;
            }

            switch (prop) {
                case "defaultXOnyxia":
                    s3Config.isXOnyxiaDefault = true;
                    return;
                case "explorer":
                    s3Config.isExplorerConfig = true;
                    return;
            }
            assert<Equals<typeof prop, never>>(false);
        });

        return s3Configs;
    }
);

export const selectors = { s3Configs };
