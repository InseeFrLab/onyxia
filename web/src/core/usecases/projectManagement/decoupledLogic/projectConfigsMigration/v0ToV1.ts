import type { ProjectConfigs } from "../ProjectConfigs";
import { assert, type Equals } from "tsafe/assert";
import type { StringifyableAtomic } from "core/tools/Stringifyable";
import type { SecretsManager } from "core/ports/SecretsManager";
import { join as pathJoin } from "pathe";
import { secretToValue, valueToSecret } from "../secretParsing";

namespace v0 {
    export type ProjectConfigs = {
        servicePassword: string;
        restorableConfigs: ProjectConfigs.RestorableServiceConfig[];
        s3: {
            customConfigs: ProjectConfigs.CustomS3Config[];
            indexForXOnyxia: number | undefined;
            indexForExplorer: number | undefined;
        };
        clusterNotificationCheckoutTime: number;
    };

    namespace ProjectConfigs {
        export type CustomS3Config = {
            url: string;
            region: string;
            workingDirectoryPath: string;
            pathStyleAccess: boolean;
            accountFriendlyName: string;
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
            formFieldsValueDifferentFromDefault: FormFieldValue[];
        };
    }

    type FormFieldValue = {
        path: string[];
        value: FormFieldValue.Value;
    };

    namespace FormFieldValue {
        export type Value = string | boolean | number | Value.Yaml;

        export namespace Value {
            export type Yaml = {
                type: "yaml";
                yamlStr: string;
            };
        }
    }
}

namespace v1 {
    export type ProjectConfigs = {
        __modelVersion: 1;
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
        };
    }
}

assert<Equals<v1.ProjectConfigs, ProjectConfigs>>;

export async function v0ToV1(params: {
    projectVaultTopDirPath_reserved: string;
    secretsManager: SecretsManager;
}) {
    const { projectVaultTopDirPath_reserved, secretsManager } = params;

    for (const key of [
        "servicePassword",
        "restorableConfigs",
        "s3",
        "clusterNotificationCheckoutTime"
    ] as const) {
        assert<Equals<typeof key, keyof v0.ProjectConfigs>>();

        switch (key) {
            case "servicePassword":
                assert<
                    Equals<v0.ProjectConfigs[typeof key], v1.ProjectConfigs[typeof key]>
                >();
                break;
            case "restorableConfigs":
                {
                    const path = pathJoin(projectVaultTopDirPath_reserved, key);

                    assert<typeof key extends keyof v1.ProjectConfigs ? true : false>();

                    const legacyValue = await secretsManager
                        .get({ path })
                        .then(
                            ({ secret }) =>
                                secretToValue(secret) as v0.ProjectConfigs[typeof key]
                        );

                    console.log("TODO: Convert legacyValue to newValue", legacyValue);

                    const newValue: v1.ProjectConfigs[typeof key] = [];

                    await secretsManager.put({
                        path,
                        "secret": valueToSecret(newValue)
                    });
                }
                break;
            case "s3":
                {
                    const path = pathJoin(projectVaultTopDirPath_reserved, key);

                    assert<typeof key extends keyof v1.ProjectConfigs ? true : false>();

                    const legacyValue = await secretsManager
                        .get({ path })
                        .then(
                            ({ secret }) =>
                                secretToValue(secret) as v0.ProjectConfigs[typeof key]
                        );

                    console.log("TODO: Convert legacyValue to newValue", legacyValue);

                    const newValue: v1.ProjectConfigs[typeof key] = {
                        "s3Configs": [],
                        "s3ConfigId_defaultXOnyxia": undefined,
                        "s3ConfigId_explorer": undefined
                    };

                    await secretsManager.put({
                        path,
                        "secret": valueToSecret(newValue)
                    });
                }
                break;
            case "clusterNotificationCheckoutTime":
                assert<
                    Equals<v0.ProjectConfigs[typeof key], v1.ProjectConfigs[typeof key]>
                >();
                break;
        }
    }
}
