import * as projectManagement from "core/usecases/projectManagement";
import type { DeploymentRegion } from "core/ports/OnyxiaApi/DeploymentRegion";
import { bucketNameAndObjectNameFromS3Path } from "core/adapters/s3Client/utils/bucketNameAndObjectNameFromS3Path";
import type { ParamsOfCreateS3Client } from "core/adapters/s3Client";
import { same } from "evt/tools/inDepth/same";
import { getWorkingDirectoryPath } from "./getWorkingDirectoryPath";
import { getWorkingDirectoryBucketToCreate } from "./getWorkingDirectoryBucket";
import { fnv1aHashToHex } from "core/tools/fnv1aHashToHex";
import { assert, type Equals } from "tsafe/assert";
import { getProjectS3ConfigId } from "./projectS3ConfigId";
import type * as s3ConfigConnectionTest from "core/usecases/s3ConfigConnectionTest";
import type { LocalizedString } from "core/ports/OnyxiaApi";

export type S3Config = S3Config.FromDeploymentRegion | S3Config.FromProject;

export namespace S3Config {
    type Common = {
        id: string;
        dataSource: string;
        region: string | undefined;
        workingDirectoryPath: string;
        isXOnyxiaDefault: boolean;
        isExplorerConfig: boolean;
    };

    export type FromDeploymentRegion = Common & {
        origin: "deploymentRegion";
        paramsOfCreateS3Client: ParamsOfCreateS3Client;
        locations: {
            adminBookmarks: {
                directoryPath: string;
                title: LocalizedString;
                description: LocalizedString | undefined;
            }[];
            projects: {
                projectName: string;
                dataSource: string;
                directoryPath: string;
            }[];
            personal: {
                username: string;
                dataSource: string;
                directoryPath: string;
            };
        };
    };

    export type FromProject = Common & {
        origin: "project";
        paramsOfCreateS3Client: ParamsOfCreateS3Client.NoSts;
        creationTime: number;
        friendlyName: string;
        connectionTestStatus:
            | { status: "not tested" }
            | { status: "test ongoing" }
            | { status: "test failed"; errorMessage: string }
            | { status: "test succeeded" };
    };
}

export function getS3Configs(params: {
    projectConfigsS3: projectManagement.ProjectConfigs["s3"];
    s3RegionConfigs: DeploymentRegion.S3Config[];
    configTestResults: s3ConfigConnectionTest.ConfigTestResult[];
    ongoingConfigTests: s3ConfigConnectionTest.OngoingConfigTest[];
    username: string;
    projectGroup: string | undefined;
    groupProjects: {
        name: string;
        group: string;
    }[];
}): S3Config[] {
    const {
        projectConfigsS3: {
            s3Configs: s3ProjectConfigs,
            s3ConfigId_defaultXOnyxia,
            s3ConfigId_explorer
        },
        s3RegionConfigs,
        configTestResults,
        ongoingConfigTests,
        username,
        projectGroup,
        groupProjects
    } = params;

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
    }): S3Config.FromProject["connectionTestStatus"] => {
        const { workingDirectoryPath, paramsOfCreateS3Client } = params;

        if (
            ongoingConfigTests.find(
                e =>
                    same(e.paramsOfCreateS3Client, paramsOfCreateS3Client) &&
                    e.workingDirectoryPath === workingDirectoryPath
            ) !== undefined
        ) {
            return { status: "test ongoing" };
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
                ? { status: "test succeeded" }
                : { status: "test failed", errorMessage: result.errorMessage };
        }

        return { status: "not tested" };
    };

    const s3Configs: S3Config[] = [
        ...s3ProjectConfigs
            .map((c): S3Config.FromProject => {
                const id = getProjectS3ConfigId({
                    creationTime: c.creationTime
                });

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
                    origin: "project",
                    creationTime: c.creationTime,
                    friendlyName: c.friendlyName,
                    id,
                    dataSource: getDataSource({
                        url,
                        pathStyleAccess,
                        workingDirectoryPath
                    }),
                    region,
                    workingDirectoryPath,
                    paramsOfCreateS3Client,
                    isXOnyxiaDefault: false,
                    isExplorerConfig: false,
                    connectionTestStatus: getConnectionTestStatus({
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
                          type: "personalProject" as const,
                          username
                      }
                    : {
                          type: "groupProject" as const,
                          projectGroup
                      };

            const workingDirectoryPath = getWorkingDirectoryPath({
                workingDirectory: c.workingDirectory,
                context: workingDirectoryContext
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
                    workingDirectory: c.workingDirectory,
                    context: workingDirectoryContext
                })
            };

            const adminBookmarks: S3Config.FromDeploymentRegion["locations"]["adminBookmarks"] =
                c.bookmarkedDirectory.map(({ title, description, bucketName, path }) => ({
                    title,
                    description,
                    directoryPath: `${bucketName}/${path ?? ""}`
                }));

            const dataSource = getDataSource({
                url,
                pathStyleAccess,
                workingDirectoryPath
            });

            return {
                origin: "deploymentRegion",
                id,
                dataSource,
                region,
                workingDirectoryPath,
                locations: {
                    adminBookmarks,
                    personal: {
                        username,
                        dataSource,
                        directoryPath: workingDirectoryPath
                    },
                    projects: groupProjects.map(({ name, group }) => {
                        const directoryPath = getWorkingDirectoryPath({
                            workingDirectory: c.workingDirectory,
                            context: {
                                type: "groupProject",
                                projectGroup: group
                            }
                        });

                        return {
                            dataSource: getDataSource({
                                url,
                                pathStyleAccess,
                                workingDirectoryPath: directoryPath
                            }),
                            directoryPath,
                            projectName: name
                        };
                    })
                },
                paramsOfCreateS3Client,
                isXOnyxiaDefault: false,
                isExplorerConfig: false
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
