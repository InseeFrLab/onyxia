import type { ProjectConfigs } from "../ProjectConfigs";
import { assert, type Equals } from "tsafe/assert";
import type { StringifyableAtomic } from "core/tools/Stringifyable";
import type { SecretsManager } from "core/ports/SecretsManager";
import { join as pathJoin } from "pathe";
import { secretToValue, valueToSecret } from "../secretParsing";
import { v1 } from "./v0ToV1";

namespace v2 {
    export type ProjectConfigs = {
        __modelVersion: 2;
        servicePassword: string;
        restorableConfigs: ProjectConfigs.RestorableServiceConfig[];
        s3: {
            s3Configs: ProjectConfigs.S3Config[];
            s3ConfigId_defaultXOnyxia: string | undefined;
            s3ConfigId_explorer: string | undefined;
        };
        clusterNotificationCheckoutTime: number;
    };

    export namespace ProjectConfigs {
        export type S3Config = {
            creationTime: number;
            friendlyName: string;
            url: string;
            region: string | undefined;
            workingDirectoryPath: string;
            pathStyleAccess: boolean;
            credentials:
                | {
                      accessKeyId: string;
                      secretAccessKey: string;
                      sessionToken: string | undefined;
                  }
                | undefined;
        };

        export type RestorableServiceConfig = {
            friendlyName: string;
            isShared: boolean | undefined;
            catalogId: string;
            chartName: string;
            chartVersion: string;
            s3ConfigId: string | undefined;
            helmValuesPatch: {
                path: (string | number)[];
                value: StringifyableAtomic | undefined;
            }[];
            restorableServiceConfigId: string;
        };
    }
}

assert<Equals<v2.ProjectConfigs, ProjectConfigs>>();

export async function v1ToV2(params: {
    projectVaultTopDirPath_reserved: string;
    secretsManager: SecretsManager;
}) {
    console.log("Performing v1 to v2 migration");

    const { projectVaultTopDirPath_reserved, secretsManager } = params;

    for (const key of [
        "__modelVersion",
        "servicePassword",
        "s3",
        "restorableConfigs",
        "clusterNotificationCheckoutTime"
    ] as const) {
        assert<Equals<typeof key, keyof v1.ProjectConfigs>>();

        switch (key) {
            case "clusterNotificationCheckoutTime":
            case "s3":
            case "servicePassword":
                assert<
                    Equals<v1.ProjectConfigs[typeof key], v2.ProjectConfigs[typeof key]>
                >();
                break;
            case "__modelVersion":
                {
                    const path = pathJoin(projectVaultTopDirPath_reserved, key);

                    assert<typeof key extends keyof v1.ProjectConfigs ? true : false>();

                    await secretsManager.put({
                        path,
                        secret: valueToSecret(2)
                    });
                }
                break;
            case "restorableConfigs":
                {
                    const path = pathJoin(projectVaultTopDirPath_reserved, key);

                    assert<typeof key extends keyof v1.ProjectConfigs ? true : false>();

                    const legacyValue = await secretsManager
                        .get({ path })
                        .then(
                            ({ secret }) =>
                                secretToValue(secret) as v1.ProjectConfigs[typeof key]
                        );

                    const now = Date.now();

                    const newValue: v2.ProjectConfigs[typeof key] = legacyValue.map(
                        (restorableServiceConfigs, i) => ({
                            ...restorableServiceConfigs,
                            restorableServiceConfigId: `${now}-${i}`
                        })
                    );

                    await secretsManager.put({
                        path,
                        secret: valueToSecret(newValue)
                    });
                }
                break;
        }
    }
}
