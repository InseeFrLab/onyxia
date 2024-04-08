import "minimal-polyfills/Object.fromEntries";
import type { State as RootState } from "core/bootstrap";
import { assert } from "tsafe/assert";
import { same } from "evt/tools/inDepth/same";
import { formFieldsValueToObject } from "../FormField";
import {
    onyxiaFriendlyNameFormFieldPath,
    onyxiaIsSharedFormFieldPath
} from "core/ports/OnyxiaApi";
import { scaffoldingIndexedFormFieldsToFinal } from "./scaffoldingIndexedFormFieldsToFinal";
import type { IndexedFormFields } from "../FormField";
import { createGetIsFieldHidden } from "./getIsFieldHidden";
import * as yaml from "yaml";
import { name, type State } from "../state";
import * as restorableConfigManagement from "core/usecases/restorableConfigManagement";
import * as projectManagement from "core/usecases/projectManagement";
import * as s3ConfigManagement from "core/usecases/s3ConfigManagement";
import * as userConfigs from "core/usecases/userConfigs";
import { exclude } from "tsafe/exclude";
import { createSelector } from "clean-architecture";
import { id } from "tsafe/id";

const readyState = (rootState: RootState): State.Ready | undefined => {
    const state = rootState[name];
    switch (state.stateDescription) {
        case "ready":
            return state;
        default:
            return undefined;
    }
};

const isReady = createSelector(readyState, state => state !== undefined);

const chartName = createSelector(readyState, state => state?.chartName);

const formFields = createSelector(readyState, state => state?.formFields);

const infosAboutWhenFieldsShouldBeHidden = createSelector(
    readyState,
    state => state?.infosAboutWhenFieldsShouldBeHidden
);

const nonLibraryChartDependencies = createSelector(readyState, state => {
    if (state === undefined) {
        return undefined;
    }

    return state.nonLibraryChartDependencies;
});

const friendlyName = createSelector(formFields, formFields => {
    if (formFields === undefined) {
        return undefined;
    }

    const friendlyName = formFields.find(({ path }) =>
        same(path, onyxiaFriendlyNameFormFieldPath.split("."))
    )!.value;

    assert(typeof friendlyName === "string");

    return friendlyName;
});

const valuesSchema = createSelector(readyState, state => state?.valuesSchema);

const indexedFormFields = createSelector(
    isReady,
    valuesSchema,
    formFields,
    infosAboutWhenFieldsShouldBeHidden,
    chartName,
    nonLibraryChartDependencies,
    (
        isReady,
        valuesSchema,
        formFields,
        infosAboutWhenFieldsShouldBeHidden,
        packageName,
        nonLibraryChartDependencies
    ): IndexedFormFields | undefined => {
        if (!isReady) {
            return undefined;
        }

        assert(valuesSchema !== undefined);
        assert(formFields !== undefined);
        assert(packageName !== undefined);
        assert(nonLibraryChartDependencies !== undefined);
        assert(infosAboutWhenFieldsShouldBeHidden !== undefined);

        const indexedFormFields: IndexedFormFields.Scaffolding = {};

        const { getIsFieldHidden } = createGetIsFieldHidden({
            formFields,
            infosAboutWhenFieldsShouldBeHidden
        });

        const nonHiddenFormFields = formFields.filter(
            ({ path }) => !getIsFieldHidden({ path })
        );

        [...nonLibraryChartDependencies, "global"].forEach(dependencyOrGlobal => {
            const formFieldsByTabName: IndexedFormFields.Scaffolding[string]["formFieldsByTabName"] =
                {};

            nonHiddenFormFields
                .filter(({ path }) => path[0] === dependencyOrGlobal)
                .forEach(formField => {
                    (formFieldsByTabName[formField.path[1]] ??= {
                        "description": (() => {
                            const o = valuesSchema.properties[formField.path[0]];

                            assert(o?.type === "object" && "properties" in o);

                            return o.properties[formField.path[1]].description;
                        })(),
                        "formFields": []
                    }).formFields.push(formField);

                    nonHiddenFormFields.splice(nonHiddenFormFields.indexOf(formField), 1);
                });

            if (
                dependencyOrGlobal === "global" &&
                Object.keys(formFieldsByTabName).length === 0
            ) {
                return;
            }

            indexedFormFields[dependencyOrGlobal] = {
                formFieldsByTabName,
                "meta":
                    dependencyOrGlobal === "global"
                        ? {
                              "type": "global",
                              "description": valuesSchema.properties["global"].description
                          }
                        : {
                              "type": "dependency"
                          }
            };
        });

        {
            const formFieldsByTabName: IndexedFormFields.Scaffolding[string]["formFieldsByTabName"] =
                indexedFormFields[packageName]?.formFieldsByTabName ?? {};

            nonHiddenFormFields.forEach(formField =>
                (
                    formFieldsByTabName[formField.path[0]] ??
                    (formFieldsByTabName[formField.path[0]] = {
                        "description":
                            valuesSchema.properties[formField.path[0]].description,
                        "formFields": []
                    })
                ).formFields.push(formField)
            );

            indexedFormFields[packageName] = {
                formFieldsByTabName,
                "meta": { "type": "package" }
            };
        }

        //Re assign packageName so it appears before other cards
        return Object.fromEntries(
            Object.entries(scaffoldingIndexedFormFieldsToFinal(indexedFormFields)).sort(
                ([key]) => (key === packageName ? -1 : 0)
            )
        );
    }
);

export type FormFieldValidity = FormFieldValidity.Valid | FormFieldValidity.Invalid;

export namespace FormFieldValidity {
    type Common = {
        path: string[];
    };

    export type Valid = Common & {
        isWellFormed: true;
    };

    export type Invalid =
        | Invalid.MismatchingPattern
        | Invalid.InvalidYamlObject
        | Invalid.InvalidYamlArray;

    export namespace Invalid {
        type CommonInner = Common & {
            isWellFormed: false;
        };

        export type MismatchingPattern = CommonInner & {
            message: "mismatching pattern";
            pattern: string;
        };

        export type InvalidYamlObject = CommonInner & {
            isWellFormed: false;
            message: "Invalid YAML Object";
        };

        export type InvalidYamlArray = CommonInner & {
            isWellFormed: false;
            message: "Invalid YAML Array";
        };
    }
}

const formFieldsIsWellFormed = createSelector(
    isReady,
    formFields,
    infosAboutWhenFieldsShouldBeHidden,
    (
        isReady,
        formFields,
        infosAboutWhenFieldsShouldBeHidden
    ): FormFieldValidity[] | undefined => {
        if (!isReady) {
            return undefined;
        }

        assert(formFields !== undefined);
        assert(infosAboutWhenFieldsShouldBeHidden !== undefined);

        const { getIsFieldHidden } = createGetIsFieldHidden({
            formFields,
            infosAboutWhenFieldsShouldBeHidden
        });

        return formFields
            .filter(({ path }) => !getIsFieldHidden({ path }))
            .map((formField): FormFieldValidity => {
                const { path } = formField;

                const valid: FormFieldValidity.Valid = {
                    path,
                    "isWellFormed": true
                };

                switch (formField.type) {
                    case "text": {
                        const { pattern } = formField;

                        if (pattern === undefined) {
                            return valid;
                        }

                        const isWellFormed =
                            pattern === undefined ||
                            new RegExp(pattern).test(formField.value);

                        return isWellFormed
                            ? valid
                            : {
                                  path,
                                  "isWellFormed": false,
                                  "message": "mismatching pattern",
                                  pattern
                              };
                    }
                    case "object": {
                        const { value } = formField;

                        assert(value.type === "yaml");
                        const isWellFormed = (() => {
                            let obj: any;

                            try {
                                obj = yaml.parse(value.yamlStr);
                            } catch {
                                return false;
                            }

                            return obj instanceof Object && !(obj instanceof Array);
                        })();

                        return isWellFormed
                            ? valid
                            : {
                                  path,
                                  "isWellFormed": false,
                                  "message": "Invalid YAML Object"
                              };
                    }
                    case "array": {
                        const { value } = formField;

                        assert(value.type === "yaml");

                        const isWellFormed = (() => {
                            let arr: any;

                            try {
                                arr = yaml.parse(value.yamlStr);
                            } catch {
                                return false;
                            }

                            return arr instanceof Array;
                        })();

                        return isWellFormed
                            ? valid
                            : {
                                  path,
                                  "isWellFormed": false,
                                  "message": "Invalid YAML Array"
                              };
                    }
                    default:
                        return {
                            path,
                            "isWellFormed": true
                        } as const;
                }
            });
    }
);

const isLaunchable = createSelector(
    formFieldsIsWellFormed,
    (formFieldsIsWellFormed): boolean | undefined => {
        if (!formFieldsIsWellFormed) {
            return undefined;
        }

        return formFieldsIsWellFormed.every(({ isWellFormed }) => isWellFormed);
    }
);

const pathOfFormFieldsWhoseValuesAreDifferentFromDefault = createSelector(
    readyState,
    state => state?.pathOfFormFieldsWhoseValuesAreDifferentFromDefault
);

const catalogId = createSelector(readyState, state => state?.catalogId);

const chartVersion = createSelector(readyState, state => {
    if (state === undefined) {
        return undefined;
    }

    return state.chartVersion;
});

const restorableConfig = createSelector(
    isReady,
    catalogId,
    chartName,
    chartVersion,
    formFields,
    pathOfFormFieldsWhoseValuesAreDifferentFromDefault,
    (
        isReady,
        catalogId,
        chartName,
        chartVersion,
        formFields,
        pathOfFormFieldsWhoseValuesAreDifferentFromDefault
    ): projectManagement.ProjectConfigs.RestorableServiceConfig | undefined => {
        if (!isReady) {
            return undefined;
        }

        assert(catalogId !== undefined);
        assert(chartName !== undefined);
        assert(chartVersion !== undefined);
        assert(formFields !== undefined);
        assert(pathOfFormFieldsWhoseValuesAreDifferentFromDefault !== undefined);

        return {
            catalogId,
            chartName,
            chartVersion,
            "formFieldsValueDifferentFromDefault":
                pathOfFormFieldsWhoseValuesAreDifferentFromDefault.map(({ path }) => ({
                    path,
                    "value": formFields.find(formField => same(formField.path, path))!
                        .value
                }))
        };
    }
);

const isRestorableConfigSaved = createSelector(
    isReady,
    restorableConfig,
    restorableConfigManagement.protectedSelectors.restorableConfigs,
    (isReady, restorableConfig, restorableConfigs) => {
        if (!isReady) {
            return undefined;
        }

        assert(restorableConfig !== undefined);

        return (
            restorableConfigs.find(restorableConfig_i =>
                restorableConfigManagement.getAreSameRestorableConfig(
                    restorableConfig_i,
                    restorableConfig
                )
            ) !== undefined
        );
    }
);

const chartVersionDifferentFromDefault = createSelector(readyState, state => {
    if (state === undefined) {
        return undefined;
    }

    const { chartVersion, defaultChartVersion } = state;

    return chartVersion === defaultChartVersion ? undefined : chartVersion;
});

const areAllFieldsDefault = createSelector(
    isReady,
    pathOfFormFieldsWhoseValuesAreDifferentFromDefault,
    chartVersionDifferentFromDefault,
    (
        isReady,
        pathOfFormFieldsWhoseValuesAreDifferentFromDefault,
        chartVersionDifferentFromDefault
    ) => {
        if (!isReady) {
            return undefined;
        }
        assert(pathOfFormFieldsWhoseValuesAreDifferentFromDefault !== undefined);

        return (
            pathOfFormFieldsWhoseValuesAreDifferentFromDefault.length === 0 &&
            chartVersionDifferentFromDefault === undefined
        );
    }
);

const chartIconUrl = createSelector(readyState, state => {
    if (state === undefined) {
        return undefined;
    }
    return state.chartIconUrl;
});

const helmReleaseName = createSelector(readyState, state => {
    if (state === undefined) {
        return undefined;
    }
    return `${state.chartName}-${state.k8sRandomSubdomain}`;
});

const catalogRepositoryUrl = createSelector(readyState, state => {
    if (state === undefined) {
        return undefined;
    }
    return state.catalogRepositoryUrl;
});

const launchCommands = createSelector(
    isReady,
    catalogId,
    chartName,
    formFields,
    catalogRepositoryUrl,
    helmReleaseName,
    projectManagement.selectors.currentProject,
    chartVersionDifferentFromDefault,
    (
        isReady,
        catalogId,
        chartName,
        formFields,
        catalogRepositoryUrl,
        helmReleaseName,
        project,
        chartVersionDifferentFromDefault
    ) => {
        if (!isReady) {
            return undefined;
        }

        assert(catalogId !== undefined);
        assert(chartName !== undefined);
        assert(formFields !== undefined);
        assert(catalogRepositoryUrl !== undefined);
        assert(helmReleaseName !== undefined);

        return [
            `helm repo add ${catalogId} ${catalogRepositoryUrl}`,
            [
                "cat << EOF > ./values.yaml",
                yaml.stringify(formFieldsValueToObject(formFields)),
                "EOF"
            ].join("\n"),
            [
                `helm install ${helmReleaseName} ${catalogId}/${chartName}`,
                project.group === undefined
                    ? undefined
                    : `--namespace ${project.namespace}`,
                chartVersionDifferentFromDefault === undefined
                    ? undefined
                    : `--version ${chartVersionDifferentFromDefault}`,
                `-f values.yaml`
            ]
                .filter(exclude(undefined))
                .join(" ")
        ];
    }
);

const launchScript = createSelector(
    isReady,
    launchCommands,
    helmReleaseName,
    (isReady, launchCommands, helmReleaseName) => {
        if (!isReady) {
            return undefined;
        }
        assert(launchCommands !== undefined);
        assert(helmReleaseName !== undefined);
        return {
            "fileBasename": `launch-${helmReleaseName}.sh`,
            "content": launchCommands.join("\n\n")
        };
    }
);

const commandLogsEntries = createSelector(
    launchCommands,
    userConfigs.selectors.userConfigs,
    (launchCommands, userConfigs) => {
        if (launchCommands === undefined) {
            return undefined;
        }

        if (!userConfigs.isCommandBarEnabled) {
            return undefined;
        }

        return launchCommands.map((cmd, i) => ({
            "cmdId": i,
            cmd,
            "resp": ""
        }));
    }
);

const chartSourceUrls = createSelector(readyState, state => {
    if (state === undefined) {
        return undefined;
    }
    return state.chartSourceUrls;
});

const groupProjectName = createSelector(
    projectManagement.selectors.currentProject,
    project => (project.group === undefined ? undefined : project.name)
);

const isShared = createSelector(
    isReady,
    formFields,
    groupProjectName,
    (isReady, formFields, groupProjectName) => {
        if (!isReady) {
            return undefined;
        }

        assert(formFields !== undefined);

        if (groupProjectName === undefined) {
            return;
        }

        const isShared = formFields.find(({ path }) =>
            same(path, onyxiaIsSharedFormFieldPath.split("."))
        )!.value;

        assert(typeof isShared === "boolean");

        return isShared;
    }
);

const availableChartVersions = createSelector(readyState, state => {
    if (state === undefined) {
        return undefined;
    }
    return state.availableChartVersions;
});

const catalogName = createSelector(readyState, state => state?.catalogName);

const willOverwriteExistingConfigOnSave = createSelector(
    isReady,
    chartName,
    catalogId,
    friendlyName,
    restorableConfigManagement.protectedSelectors.restorableConfigs,
    restorableConfigManagement.protectedSelectors
        .chartIconAndFriendlyNameByRestorableConfigIndex,
    (
        isReady,
        chartName,
        catalogId,
        friendlyName,
        restorableConfigs,
        chartIconAndFriendlyNameByRestorableConfigIndex
    ) => {
        if (!isReady) {
            return undefined;
        }

        assert(friendlyName !== undefined);
        assert(chartName !== undefined);
        assert(catalogId !== undefined);

        return (
            restorableConfigs.find(
                (restorableConfig, i) =>
                    restorableConfig.catalogId === catalogId &&
                    restorableConfig.chartName === chartName &&
                    chartIconAndFriendlyNameByRestorableConfigIndex[i].friendlyName ===
                        friendlyName
            ) !== undefined
        );
    }
);

const s3ConfigSelect = createSelector(
    readyState,
    s3ConfigManagement.selectors.s3Configs,
    (state, s3Configs) => {
        if (state === undefined) {
            return undefined;
        }

        // We don't display the s3 config selector if there is no config or only one
        if (s3Configs.length <= 1) {
            return undefined;
        }

        // If the chart at hand does not use s3, we don't display the s3 config selector
        if (state.pathOfFormFieldsAffectedByS3ConfigChange.length === 0) {
            return undefined;
        }

        const options = s3Configs.map(s3Config => ({
            "customConfigIndex": s3Config.customConfigIndex,
            "dataSource": s3Config.dataSource,
            "accountFriendlyName": s3Config.accountFriendlyName
        }));

        type SelectedOption =
            | {
                  type: "sts";
              }
            | {
                  type: "custom";
                  customS3ConfigIndex: number;
              }
            | {
                  type: "manual form input";
              };

        const selectedOption: SelectedOption = (() => {
            if (state.has3sConfigBeenManuallyChanged) {
                return id<SelectedOption>({
                    "type": "manual form input"
                });
            }

            if (state.selectedCustomS3ConfigIndex === undefined) {
                return id<SelectedOption>({
                    "type": "sts"
                });
            }

            return id<SelectedOption>({
                "type": "custom",
                "customS3ConfigIndex": state.selectedCustomS3ConfigIndex
            });
        })();

        return { options, selectedOption };
    }
);

const main = createSelector(
    isReady,
    friendlyName,
    willOverwriteExistingConfigOnSave,
    isShared,
    indexedFormFields,
    isLaunchable,
    formFieldsIsWellFormed,
    restorableConfig,
    isRestorableConfigSaved,
    areAllFieldsDefault,
    chartName,
    chartVersion,
    availableChartVersions,
    catalogName,
    catalogRepositoryUrl,
    chartIconUrl,
    launchScript,
    commandLogsEntries,
    chartSourceUrls,
    groupProjectName,
    s3ConfigSelect,
    (
        isReady,
        friendlyName,
        willOverwriteExistingConfigOnSave,
        isShared,
        indexedFormFields,
        isLaunchable,
        formFieldsIsWellFormed,
        restorableConfig,
        isRestorableConfigSaved,
        areAllFieldsDefault,
        chartName,
        chartVersion,
        availableChartVersions,
        catalogName,
        catalogRepositoryUrl,
        chartIconUrl,
        launchScript,
        commandLogsEntries,
        chartSourceUrls,
        groupProjectName,
        s3ConfigSelect
    ) => {
        if (!isReady) {
            return {
                "isReady": false as const
            };
        }

        assert(friendlyName !== undefined);
        assert(willOverwriteExistingConfigOnSave !== undefined);
        assert(restorableConfig !== undefined);
        assert(isRestorableConfigSaved !== undefined);
        assert(indexedFormFields !== undefined);
        assert(isLaunchable !== undefined);
        assert(formFieldsIsWellFormed !== undefined);
        assert(chartName !== undefined);
        assert(chartVersion !== undefined);
        assert(availableChartVersions !== undefined);
        assert(catalogName !== undefined);
        assert(catalogRepositoryUrl !== undefined);
        assert(launchScript !== undefined);
        assert(chartSourceUrls !== undefined);

        return {
            "isReady": true as const,
            friendlyName,
            willOverwriteExistingConfigOnSave,
            isShared,
            indexedFormFields,
            isLaunchable,
            formFieldsIsWellFormed,
            restorableConfig,
            isRestorableConfigSaved,
            areAllFieldsDefault,
            chartName,
            chartVersion,
            availableChartVersions,
            catalogName,
            catalogRepositoryUrl,
            chartIconUrl,
            launchScript,
            commandLogsEntries,
            chartSourceUrls,
            groupProjectName,
            s3ConfigSelect
        };
    }
);

export const selectors = { main };

const formFieldsValueDifferentFromDefault = createSelector(
    isReady,
    restorableConfig,
    (isReady, restorableConfig) => {
        if (!isReady) {
            return undefined;
        }

        assert(restorableConfig !== undefined);

        return restorableConfig.formFieldsValueDifferentFromDefault;
    }
);

const has3sConfigBeenManuallyChanged = createSelector(readyState, state => {
    if (state === undefined) {
        return undefined;
    }
    return state.has3sConfigBeenManuallyChanged;
});

export const privateSelectors = {
    helmReleaseName,
    formFieldsValueDifferentFromDefault,
    isShared,
    has3sConfigBeenManuallyChanged
};
