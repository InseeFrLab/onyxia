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
import { name } from "../state";
import * as restorableConfigManagement from "core/usecases/restorableConfigManagement";
import * as projectManagement from "core/usecases/projectManagement";
import * as s3ConfigManagement from "core/usecases/s3ConfigManagement";
import * as userConfigs from "core/usecases/userConfigs";
import { exclude } from "tsafe/exclude";
import { createSelector } from "clean-architecture";
import { id } from "tsafe/id";

const readyState = (rootState: RootState) => {
    const state = rootState[name];

    if (state.stateDescription !== "ready") {
        return null;
    }

    return state;
};

const isReady = createSelector(readyState, state => state !== null);

const chartName = createSelector(readyState, state => {
    if (state === null) {
        return null;
    }
    return state.chartName;
});

const formFields = createSelector(readyState, state => {
    if (state === null) {
        return null;
    }
    return state.formFields;
});

const infosAboutWhenFieldsShouldBeHidden = createSelector(readyState, state => {
    if (state === null) {
        return null;
    }
    return state.infosAboutWhenFieldsShouldBeHidden;
});

const nonLibraryChartDependencies = createSelector(readyState, state => {
    if (state === null) {
        return null;
    }

    return state.nonLibraryChartDependencies;
});

const friendlyName = createSelector(isReady, formFields, (isReady, formFields) => {
    if (!isReady) {
        return null;
    }

    assert(formFields !== null);

    const friendlyName = formFields.find(({ path }) =>
        same(path, onyxiaFriendlyNameFormFieldPath.split("."))
    )!.value;

    assert(typeof friendlyName === "string");

    return friendlyName;
});

const valuesSchema = createSelector(readyState, state => {
    if (state === null) {
        return null;
    }
    return state.valuesSchema;
});

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
    ): IndexedFormFields | null => {
        if (!isReady) {
            return null;
        }

        assert(valuesSchema !== null);
        assert(formFields !== null);
        assert(infosAboutWhenFieldsShouldBeHidden !== null);
        assert(packageName !== null);
        assert(nonLibraryChartDependencies !== null);

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
    ): FormFieldValidity[] | null => {
        if (!isReady) {
            return null;
        }

        assert(formFields !== null);
        assert(infosAboutWhenFieldsShouldBeHidden !== null);

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
    isReady,
    formFieldsIsWellFormed,
    (isReady, formFieldsIsWellFormed): boolean | null => {
        if (!isReady) {
            return null;
        }

        assert(formFieldsIsWellFormed !== null);

        return formFieldsIsWellFormed.every(({ isWellFormed }) => isWellFormed);
    }
);

const pathOfFormFieldsWhoseValuesAreDifferentFromDefault = createSelector(
    readyState,
    state => {
        if (state === null) {
            return null;
        }
        return state.pathOfFormFieldsWhoseValuesAreDifferentFromDefault;
    }
);

const catalogId = createSelector(readyState, state => {
    if (state === null) {
        return null;
    }
    return state.catalogId;
});

const chartVersion = createSelector(readyState, state => {
    if (state === null) {
        return null;
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
    ): projectManagement.ProjectConfigs.RestorableServiceConfig | null => {
        if (!isReady) {
            return null;
        }

        assert(catalogId !== null);
        assert(chartName !== null);
        assert(chartVersion !== null);
        assert(formFields !== null);
        assert(pathOfFormFieldsWhoseValuesAreDifferentFromDefault !== null);

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
            return null;
        }

        assert(restorableConfig !== null);

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
    if (state === null) {
        return null;
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
            return null;
        }
        assert(pathOfFormFieldsWhoseValuesAreDifferentFromDefault !== null);
        assert(chartVersionDifferentFromDefault !== null);

        return (
            pathOfFormFieldsWhoseValuesAreDifferentFromDefault.length === 0 &&
            chartVersionDifferentFromDefault === undefined
        );
    }
);

const chartIconUrl = createSelector(readyState, state => {
    if (state === null) {
        return null;
    }
    return state.chartIconUrl;
});

const helmReleaseName = createSelector(readyState, state => {
    if (state === null) {
        return null;
    }
    return `${state.chartName}-${state.k8sRandomSubdomain}`;
});

const catalogRepositoryUrl = createSelector(readyState, state => {
    if (state === null) {
        return null;
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
    chartVersionDifferentFromDefault,
    projectManagement.selectors.currentProject,
    (
        isReady,
        catalogId,
        chartName,
        formFields,
        catalogRepositoryUrl,
        helmReleaseName,
        chartVersionDifferentFromDefault,
        currentProject
    ) => {
        if (!isReady) {
            return null;
        }

        assert(catalogId !== null);
        assert(chartName !== null);
        assert(formFields !== null);
        assert(catalogRepositoryUrl !== null);
        assert(helmReleaseName !== null);
        assert(chartVersionDifferentFromDefault !== null);

        return [
            `helm repo add ${catalogId} ${catalogRepositoryUrl}`,
            [
                "cat << EOF > ./values.yaml",
                yaml.stringify(formFieldsValueToObject(formFields)),
                "EOF"
            ].join("\n"),
            [
                `helm install ${helmReleaseName} ${catalogId}/${chartName}`,
                currentProject.group === undefined
                    ? undefined
                    : `--namespace ${currentProject.namespace}`,
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
            return null;
        }
        assert(launchCommands !== null);
        assert(helmReleaseName !== null);
        return {
            "fileBasename": `launch-${helmReleaseName}.sh`,
            "content": launchCommands.join("\n\n")
        };
    }
);

const commandLogsEntries = createSelector(
    isReady,
    launchCommands,
    userConfigs.selectors.userConfigs,
    (isReady, launchCommands, userConfigs) => {
        if (!isReady) {
            return null;
        }

        assert(launchCommands !== null);

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

export type SourceUrls = {
    helmChartSourceUrl: string | undefined;
    helmChartRepositorySourceUrl: string | undefined;
    dockerImageSourceUrl: string | undefined;
};

const sourceUrls = createSelector(readyState, state => {
    if (state === null) {
        return null;
    }
    const { chartSourceUrls } = state;

    const chartRepositoryName = (
        state.catalogRepositoryUrl
            .split("/")
            .filter(exclude(""))
            .filter(part => !part.startsWith("http"))
            .pop() ?? state.catalogId
    ).toLowerCase();

    const chartName = state.chartName.toLowerCase();

    const helmChartSourceUrl = (() => {
        const candidates = chartSourceUrls
            .map(url => url.toLowerCase())
            .filter(url => url.includes(chartRepositoryName) && url.includes(chartName));

        return candidates.find(url => url.includes("helm")) ?? candidates.shift();
    })();

    const helmChartRepositorySourceUrl = (() => {
        from_helmChartUrl: {
            if (helmChartSourceUrl === undefined) {
                break from_helmChartUrl;
            }

            if (!helmChartSourceUrl.includes(chartRepositoryName)) {
                break from_helmChartUrl;
            }

            let candidate = helmChartSourceUrl.split("?")[0].replace(/\/$/, "");

            if (!candidate.includes("tree")) {
                break from_helmChartUrl;
            }

            if (!candidate.includes(chartName)) {
                break from_helmChartUrl;
            }

            candidate = candidate.split("/tree/")[0].replace(/\/-$/, "");

            return candidate;
        }

        const candidates = chartSourceUrls
            .map(url => url.toLowerCase())
            .filter(url => url !== helmChartSourceUrl)
            .filter(url => url.includes(chartRepositoryName));

        return candidates.find(url => url.includes("helm")) ?? candidates.shift();
    })();

    const sourceUrls: SourceUrls = {
        helmChartSourceUrl,
        helmChartRepositorySourceUrl,
        "dockerImageSourceUrl": chartSourceUrls
            .map(url => url.toLowerCase())
            .filter(url => url !== helmChartSourceUrl)
            .filter(url => url !== helmChartRepositorySourceUrl)
            .find(url => url.includes(chartName))
    };

    return sourceUrls;
});

const groupProjectName = createSelector(
    projectManagement.selectors.currentProject,
    currentProject =>
        currentProject.group === undefined ? undefined : currentProject.name
);

const isShared = createSelector(
    isReady,
    formFields,
    groupProjectName,
    (isReady, formFields, groupProjectName) => {
        if (!isReady) {
            return null;
        }

        assert(formFields !== null);

        if (groupProjectName === undefined) {
            return false;
        }

        const formField_isShared = formFields.find(({ path }) =>
            same(path, onyxiaIsSharedFormFieldPath.split("."))
        );

        if (formField_isShared === undefined) {
            return false;
        }

        assert(typeof formField_isShared.value === "boolean");

        return formField_isShared.value;
    }
);

const availableChartVersions = createSelector(readyState, state => {
    if (state === null) {
        return null;
    }
    return state.availableChartVersions;
});

const catalogName = createSelector(readyState, state => {
    if (state === null) {
        return null;
    }
    return state.catalogName;
});

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
            return null;
        }

        assert(chartName !== null);
        assert(catalogId !== null);
        assert(friendlyName !== null);

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
        if (state === null) {
            return null;
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
    chartIconUrl,
    launchScript,
    commandLogsEntries,
    groupProjectName,
    s3ConfigSelect,
    sourceUrls,
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
        chartIconUrl,
        launchScript,
        commandLogsEntries,
        groupProjectName,
        s3ConfigSelect,
        sourceUrls
    ) => {
        if (!isReady) {
            return {
                "isReady": false as const
            };
        }

        assert(friendlyName !== null);
        assert(willOverwriteExistingConfigOnSave !== null);
        assert(isShared !== null);
        assert(indexedFormFields !== null);
        assert(isLaunchable !== null);
        assert(formFieldsIsWellFormed !== null);
        assert(restorableConfig !== null);
        assert(isRestorableConfigSaved !== null);
        assert(areAllFieldsDefault !== null);
        assert(chartName !== null);
        assert(chartVersion !== null);
        assert(availableChartVersions !== null);
        assert(catalogName !== null);
        assert(chartIconUrl !== null);
        assert(launchScript !== null);
        assert(commandLogsEntries !== null);
        assert(groupProjectName !== null);
        assert(s3ConfigSelect !== null);
        assert(sourceUrls !== null);

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
            chartIconUrl,
            launchScript,
            commandLogsEntries,
            groupProjectName,
            s3ConfigSelect,
            sourceUrls
        };
    }
);

export const selectors = { main };

const formFieldsValueDifferentFromDefault = createSelector(
    isReady,
    restorableConfig,
    (isReady, restorableConfig) => {
        if (!isReady) {
            return null;
        }

        assert(restorableConfig !== null);

        return restorableConfig.formFieldsValueDifferentFromDefault;
    }
);

const has3sConfigBeenManuallyChanged = createSelector(readyState, state => {
    if (state === null) {
        return null;
    }
    return state.has3sConfigBeenManuallyChanged;
});

const helmInstallParams = createSelector(
    isReady,
    helmReleaseName,
    catalogId,
    chartName,
    chartVersion,
    formFields,
    (isReady, helmReleaseName, catalogId, chartName, chartVersion, formFields) => {
        if (!isReady) {
            return null;
        }
        assert(helmReleaseName !== null);
        assert(catalogId !== null);
        assert(chartName !== null);
        assert(chartVersion !== null);
        assert(formFields !== null);

        return {
            helmReleaseName,
            catalogId,
            chartName,
            chartVersion,
            "values": formFieldsValueToObject(formFields)
        };
    }
);

export const privateSelectors = {
    helmReleaseName,
    formFieldsValueDifferentFromDefault,
    isShared,
    has3sConfigBeenManuallyChanged,
    helmInstallParams
};
