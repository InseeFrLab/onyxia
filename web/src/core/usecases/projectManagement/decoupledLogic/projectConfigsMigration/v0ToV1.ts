import type { ProjectConfigs } from "../ProjectConfigs";
import { assert, type Equals } from "tsafe/assert";
import type { StringifyableAtomic } from "core/tools/Stringifyable";
import type { SecretsManager } from "core/ports/SecretsManager";
import { join as pathJoin } from "pathe";
import { secretToValue, valueToSecret } from "../secretParsing";
import YAML from "yaml";
import { getS3Configs } from "core/usecases/s3ConfigManagement/decoupledLogic/getS3Configs";

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

assert<Equals<v1.ProjectConfigs, ProjectConfigs>>();

export async function v0ToV1(params: {
    projectVaultTopDirPath_reserved: string;
    secretsManager: SecretsManager;
}) {
    const { projectVaultTopDirPath_reserved, secretsManager } = params;

    console.log("Performing v0 to v1 migration");

    for (const key of [
        "servicePassword",
        "s3",
        "restorableConfigs",
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

                    const newValue: v1.ProjectConfigs[typeof key] = [];

                    legacyValue.forEach(restorableServiceConfig_legacy => {
                        newValue.push({
                            friendlyName: restorableServiceConfig_legacy.friendlyName,
                            isShared: restorableServiceConfig_legacy.isShared,
                            catalogId: restorableServiceConfig_legacy.catalogId,
                            chartName: restorableServiceConfig_legacy.chartName,
                            chartVersion: restorableServiceConfig_legacy.chartVersion,
                            s3ConfigId: undefined,
                            helmValuesPatch: (() => {
                                const helmValuesPatch: {
                                    path: (string | number)[];
                                    value: StringifyableAtomic | undefined;
                                }[] = [];

                                restorableServiceConfig_legacy.formFieldsValueDifferentFromDefault.forEach(
                                    formFieldValue => {
                                        if (typeof formFieldValue.value === "object") {
                                            assert(formFieldValue.value.type === "yaml");

                                            let parsed: unknown;

                                            try {
                                                parsed = YAML.parse(
                                                    formFieldValue.value.yamlStr
                                                );
                                            } catch {
                                                return undefined;
                                            }

                                            if (
                                                typeof parsed !== "object" ||
                                                parsed === null
                                            ) {
                                                return;
                                            }

                                            (function callee(
                                                path: (string | number)[],
                                                o: object
                                            ) {
                                                Object.entries(o).forEach(
                                                    ([segment, value]) => {
                                                        const newPath = [
                                                            ...path,
                                                            segment
                                                        ];

                                                        if (
                                                            typeof value === "object" &&
                                                            value !== null
                                                        ) {
                                                            callee(newPath, value);
                                                            return;
                                                        }

                                                        helmValuesPatch.push({
                                                            path: newPath,
                                                            value
                                                        });
                                                    }
                                                );
                                            })(formFieldValue.path, parsed);

                                            return;
                                        }

                                        helmValuesPatch.push({
                                            path: formFieldValue.path,
                                            value: formFieldValue.value
                                        });
                                    }
                                );

                                return helmValuesPatch;
                            })()
                        });
                    });

                    await secretsManager.put({
                        path,
                        secret: valueToSecret(newValue)
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

                    const newValue: v1.ProjectConfigs[typeof key] = {
                        s3Configs: [],
                        s3ConfigId_defaultXOnyxia: undefined,
                        s3ConfigId_explorer: undefined
                    };

                    legacyValue.customConfigs.forEach((customS3Config_legacy, i) => {
                        newValue.s3Configs.push({
                            creationTime: Date.now() + i,
                            friendlyName: customS3Config_legacy.accountFriendlyName,
                            url: customS3Config_legacy.url,
                            region: customS3Config_legacy.region,
                            workingDirectoryPath:
                                customS3Config_legacy.workingDirectoryPath,
                            pathStyleAccess: customS3Config_legacy.pathStyleAccess,
                            credentials: customS3Config_legacy.credentials
                        });
                    });

                    {
                        const s3Configs = getS3Configs({
                            projectConfigsS3: newValue,
                            s3RegionConfigs: [],
                            configTestResults: [],
                            ongoingConfigTests: [],
                            username: "johndoe",
                            projectGroup: undefined
                        });

                        for (const [propertyName_legacy, propertyName] of [
                            ["indexForXOnyxia", "s3ConfigId_defaultXOnyxia"],
                            ["indexForExplorer", "s3ConfigId_explorer"]
                        ] as const) {
                            if (legacyValue[propertyName_legacy] !== undefined) {
                                const entry =
                                    newValue.s3Configs[legacyValue[propertyName_legacy]];

                                assert(entry !== undefined);

                                const s3Config = s3Configs.find(
                                    s3Config =>
                                        s3Config.origin === "project" &&
                                        s3Config.creationTime === entry.creationTime
                                );

                                assert(s3Config !== undefined);

                                newValue[propertyName] = s3Config.id;
                            } else {
                                newValue[propertyName] =
                                    "a-config-id-that-does-not-exist";
                            }
                        }
                    }

                    await secretsManager.put({
                        path,
                        secret: valueToSecret(newValue)
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
