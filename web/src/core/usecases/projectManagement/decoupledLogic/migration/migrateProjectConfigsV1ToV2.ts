import type { SecretsManager } from "core/ports/SecretsManager";
import { parseS3Uri } from "core/tools/S3Uri";
import { join as pathJoin } from "pathe";
import { type ProjectConfigs, zProjectConfigs } from "../ProjectConfigs";
import { secretToValue, valueToSecret } from "../secretParsing";
import {
    type ProjectConfigs as ProjectConfigs_v1,
    zProjectConfigs as zProjectConfigs_v1
} from "./ProjectConfigs_v1";

const keys_v1 = [
    "__modelVersion",
    "servicePassword",
    "restorableConfigs",
    "s3",
    "clusterNotificationCheckoutTime"
] as const satisfies readonly (keyof ProjectConfigs_v1)[];

const keys_v2 = [
    "__modelVersion",
    "servicePassword",
    "restorableServiceConfigs",
    "s3Profiles",
    "clusterNotificationCheckoutTime"
] as const satisfies readonly (keyof ProjectConfigs)[];

export async function tryMigrateProjectConfigsV1ToV2(params: {
    projectVaultTopDirPath_reserved: string;
    secretsManager: SecretsManager;
}): Promise<ProjectConfigs | undefined> {
    const { projectVaultTopDirPath_reserved, secretsManager } = params;

    const files = await secretsManager
        .list({
            path: projectVaultTopDirPath_reserved
        })
        .then(
            ({ files }) => files,
            () => [] as string[]
        );

    const projectConfigs_v1_candidate = Object.fromEntries(
        await Promise.all(
            keys_v1.map(async key => {
                if (!files.includes(key)) {
                    return [key, undefined] as const;
                }

                const { secret } = await secretsManager.get({
                    path: pathJoin(projectVaultTopDirPath_reserved, key)
                });

                return [key, secretToValue(secret)] as const;
            })
        )
    );

    const parseResult = zProjectConfigs_v1.safeParse(projectConfigs_v1_candidate);

    if (!parseResult.success) {
        return undefined;
    }

    console.log("Performing ProjectConfigs v1 to v2 migration");

    const projectConfigs = migrateProjectConfigsV1ToV2({
        projectConfigs_v1: parseResult.data
    });

    zProjectConfigs.parse(projectConfigs);

    await Promise.all(
        keys_v2.map(async key => {
            await secretsManager.put({
                path: pathJoin(projectVaultTopDirPath_reserved, key),
                secret: valueToSecret(projectConfigs[key])
            });
        })
    );

    await Promise.all(
        (["restorableConfigs", "s3"] as const).map(async key => {
            if (!files.includes(key)) {
                return;
            }

            await secretsManager
                .delete({
                    path: pathJoin(projectVaultTopDirPath_reserved, key)
                })
                .catch(error => {
                    console.warn(
                        `Failed to delete legacy ProjectConfigs key ${key}`,
                        error
                    );
                });
        })
    );

    return projectConfigs;
}

export function migrateProjectConfigsV1ToV2(params: {
    projectConfigs_v1: ProjectConfigs_v1;
}): ProjectConfigs {
    const { projectConfigs_v1 } = params;

    const alreadyUsedProfileNames = new Set<string>();

    const s3Profiles = projectConfigs_v1.s3.s3Configs.map(
        (s3Config): ProjectConfigs.S3Profile => {
            const profileName = getAvailableAwsProfileName({
                friendlyName: s3Config.friendlyName,
                alreadyUsedProfileNames
            });

            return {
                profileName,
                creationTime: s3Config.creationTime,
                url: s3Config.url,
                region: s3Config.region,
                pathStyleAccess: s3Config.pathStyleAccess,
                credentials: s3Config.credentials,
                bookmarks: (() => {
                    const bookmark = getBookmarkFromWorkingDirectoryPath({
                        workingDirectoryPath: s3Config.workingDirectoryPath
                    });

                    return bookmark === undefined ? undefined : [bookmark];
                })()
            };
        }
    );

    const s3ProfileNameByLegacyS3ConfigId = new Map(
        s3Profiles.map(({ creationTime, profileName }) => [
            getProjectS3ConfigId({ creationTime }),
            profileName
        ])
    );

    return {
        __modelVersion: 2,
        servicePassword: projectConfigs_v1.servicePassword,
        restorableServiceConfigs: projectConfigs_v1.restorableConfigs.map(
            restorableConfig => ({
                friendlyName: restorableConfig.friendlyName,
                isShared: restorableConfig.isShared,
                catalogId: restorableConfig.catalogId,
                chartName: restorableConfig.chartName,
                chartVersion: restorableConfig.chartVersion,
                s3ProfileName:
                    restorableConfig.s3ConfigId === undefined
                        ? undefined
                        : s3ProfileNameByLegacyS3ConfigId.get(
                              restorableConfig.s3ConfigId
                          ),
                helmValuesPatch: restorableConfig.helmValuesPatch
            })
        ),
        s3Profiles,
        clusterNotificationCheckoutTime: projectConfigs_v1.clusterNotificationCheckoutTime
    };
}

function getProjectS3ConfigId(params: { creationTime: number }): string {
    const { creationTime } = params;

    return `project-${creationTime}`;
}

function getAvailableAwsProfileName(params: {
    friendlyName: string;
    alreadyUsedProfileNames: Set<string>;
}): string {
    const { friendlyName, alreadyUsedProfileNames } = params;

    const baseProfileName = (() => {
        const candidate = friendlyName
            .normalize("NFKD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim()
            .replace(/[^A-Za-z0-9_-]+/g, "-")
            .replace(/^-+|-+$/g, "");

        return candidate === "" ? "profile" : candidate;
    })();

    let profileName = baseProfileName;
    let suffix = 2;

    while (alreadyUsedProfileNames.has(profileName)) {
        profileName = `${baseProfileName}-${suffix}`;
        suffix++;
    }

    alreadyUsedProfileNames.add(profileName);

    return profileName;
}

function getBookmarkFromWorkingDirectoryPath(params: {
    workingDirectoryPath: string;
}): ProjectConfigs.S3Profile.Bookmark | undefined {
    const { workingDirectoryPath } = params;

    const s3Path_withoutProtocol = workingDirectoryPath
        .trim()
        .replace(/^(s3:)?\/+/, "")
        .replace(/\/+/g, "/")
        .replace(/\/*$/g, "");

    if (s3Path_withoutProtocol === "") {
        return undefined;
    }

    const s3Path = `${s3Path_withoutProtocol}/`;

    try {
        return {
            displayName: s3Path_withoutProtocol.split("/").at(-1),
            s3Uri: parseS3Uri({
                value: `s3://${s3Path}`,
                delimiter: "/"
            })
        };
    } catch {
        return undefined;
    }
}
