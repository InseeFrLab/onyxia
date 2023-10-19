import "minimal-polyfills/Object.fromEntries";
import type { State as RootState } from "../../../core";
import { createSelector } from "@reduxjs/toolkit";
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
import { symToStr } from "tsafe/symToStr";
import * as restorableConfigManager from "core/usecases/restorableConfigManager";
import * as projectConfigs from "core/usecases/projectConfigs";

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

const chartDependencies = createSelector(readyState, state => {
    if (state === undefined) {
        return undefined;
    }

    return state.chartDependencies.filter(dependency => dependency !== "library-chart");
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

const isShared = createSelector(formFields, formFields => {
    if (formFields === undefined) {
        return undefined;
    }

    const isShared = formFields.find(({ path }) =>
        same(path, onyxiaIsSharedFormFieldPath.split("."))
    )!.value;

    assert(typeof isShared === "boolean");

    return isShared;
});

const config = createSelector(readyState, state => state?.config);

const indexedFormFields = createSelector(
    isReady,
    config,
    formFields,
    infosAboutWhenFieldsShouldBeHidden,
    chartName,
    chartDependencies,
    (
        isReady,
        config,
        formFields,
        infosAboutWhenFieldsShouldBeHidden,
        packageName,
        dependencies
    ): IndexedFormFields | undefined => {
        if (!isReady) {
            return undefined;
        }

        assert(formFields !== undefined);
        assert(packageName !== undefined);
        assert(dependencies !== undefined);
        assert(infosAboutWhenFieldsShouldBeHidden !== undefined);

        const indexedFormFields: IndexedFormFields.Scaffolding = {};

        const { getIsFieldHidden } = createGetIsFieldHidden({
            formFields,
            infosAboutWhenFieldsShouldBeHidden
        });

        const nonHiddenFormFields = formFields.filter(
            ({ path }) => !getIsFieldHidden({ path })
        );

        [...dependencies, "global"].forEach(dependencyOrGlobal => {
            const formFieldsByTabName: IndexedFormFields.Scaffolding[string]["formFieldsByTabName"] =
                {};

            nonHiddenFormFields
                .filter(({ path }) => path[0] === dependencyOrGlobal)
                .forEach(formField => {
                    (formFieldsByTabName[formField.path[1]] ??= {
                        "description": (() => {
                            const o = config?.properties[formField.path[0]];

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
                              "description": config?.properties["global"].description
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
                        "description": config?.properties[formField.path[0]].description,
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

const restorableConfig = createSelector(
    isReady,
    catalogId,
    chartName,
    formFields,
    pathOfFormFieldsWhoseValuesAreDifferentFromDefault,
    (
        isReady,
        catalogId,
        chartName,
        formFields,
        pathOfFormFieldsWhoseValuesAreDifferentFromDefault
    ): restorableConfigManager.RestorableConfig | undefined => {
        if (!isReady) {
            return undefined;
        }

        assert(catalogId !== undefined);
        assert(chartName !== undefined);
        assert(formFields !== undefined);
        assert(pathOfFormFieldsWhoseValuesAreDifferentFromDefault !== undefined);

        return {
            catalogId,
            chartName,
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
    restorableConfigManager.selectors.restorableConfigs,
    (isReady, restorableConfig, restorableConfigs) => {
        if (!isReady) {
            return undefined;
        }

        assert(restorableConfig !== undefined);

        return (
            restorableConfigs.find(restorableConfig_i =>
                restorableConfigManager.areSameRestorableConfig(
                    restorableConfig_i,
                    restorableConfig
                )
            ) !== undefined
        );
    }
);

const areAllFieldsDefault = createSelector(
    pathOfFormFieldsWhoseValuesAreDifferentFromDefault,
    pathOfFormFieldsWhoseValuesAreDifferentFromDefault => {
        if (pathOfFormFieldsWhoseValuesAreDifferentFromDefault === undefined) {
            return undefined;
        }

        return pathOfFormFieldsWhoseValuesAreDifferentFromDefault.length === 0;
    }
);

const chartIconUrl = createSelector(readyState, state => {
    if (state === undefined) {
        return undefined;
    }
    return state.chartIconUrl;
});

const releaseName = createSelector(readyState, state => {
    if (state === undefined) {
        return undefined;
    }
    return `${state.chartName}-${state.k8sRandomSubdomain}`;
});

const launchCommands = createSelector(
    readyState,
    releaseName,
    projectConfigs.selectors.selectedProject,
    (state, releaseName, project) => {
        if (state === undefined) {
            return undefined;
        }

        assert(releaseName !== undefined);

        return [
            `helm repo add ${state.catalogId} ${state.repositoryUrl}`,
            [
                "cat << EOF > ./values.yaml",
                yaml.stringify(formFieldsValueToObject(state.formFields)),
                "EOF"
            ].join("\n"),
            `helm install ${releaseName} ${state.catalogId}/${state.chartName} --namespace ${project.namespace} -f values.yaml`
        ];
    }
);

const launchScript = createSelector(
    isReady,
    launchCommands,
    releaseName,
    (isReady, launchCommands, releaseName) => {
        if (!isReady) {
            return undefined;
        }
        assert(launchCommands !== undefined);
        assert(releaseName !== undefined);
        return {
            "fileBasename": `launch-${releaseName}.sh`,
            "content": launchCommands.join("\n\n")
        };
    }
);

const commandLogsEntries = createSelector(launchCommands, launchCommands => {
    if (launchCommands === undefined) {
        return undefined;
    }

    return launchCommands.map((cmd, i) => ({
        "cmdId": i,
        cmd,
        "resp": ""
    }));
});

const chartSourceUrls = createSelector(readyState, state => state?.chartSourceUrls);

const groupProjectName = createSelector(
    projectConfigs.selectors.selectedProject,
    project => (project.group === undefined ? undefined : project.name)
);

const wrap = createSelector(
    isReady,
    friendlyName,
    isShared,
    indexedFormFields,
    isLaunchable,
    formFieldsIsWellFormed,
    restorableConfig,
    isRestorableConfigSaved,
    areAllFieldsDefault,
    chartName,
    chartIconUrl,
    launchScript,
    commandLogsEntries,
    chartSourceUrls,
    groupProjectName,
    (
        isReady,
        friendlyName,
        isShared,
        indexedFormFields,
        isLaunchable,
        formFieldsIsWellFormed,
        restorableConfig,
        isRestorableConfigSaved,
        areAllFieldsDefault,
        chartName,
        chartIconUrl,
        launchScript,
        commandLogsEntries,
        chartSourceUrls,
        groupProjectName
    ) => {
        if (!isReady) {
            return {
                "isReady": false as const,
                [symToStr({ friendlyName })]: undefined,
                [symToStr({ isShared })]: undefined,
                [symToStr({ indexedFormFields })]: undefined,
                [symToStr({ isLaunchable })]: undefined,
                [symToStr({ formFieldsIsWellFormed })]: undefined,
                [symToStr({ restorableConfig })]: undefined,
                [symToStr({ isRestorableConfigSaved })]: undefined,
                [symToStr({ restorableConfig })]: undefined,
                [symToStr({ areAllFieldsDefault })]: undefined,
                [symToStr({ chartName })]: undefined,
                [symToStr({ chartIconUrl })]: undefined,
                [symToStr({ launchScript })]: undefined,
                [symToStr({ commandLogsEntries })]: undefined,
                [symToStr({ chartSourceUrls })]: undefined,
                groupProjectName
            };
        }

        assert(friendlyName !== undefined);
        assert(restorableConfig !== undefined);
        assert(isRestorableConfigSaved !== undefined);
        assert(indexedFormFields !== undefined);
        assert(isLaunchable !== undefined);
        assert(isShared !== undefined);
        assert(formFieldsIsWellFormed !== undefined);
        assert(chartIconUrl !== undefined);
        assert(chartName !== undefined);
        assert(commandLogsEntries !== undefined);
        assert(launchScript !== undefined);
        assert(chartSourceUrls !== undefined);

        return {
            "isReady": true as const,
            friendlyName,
            isShared,
            indexedFormFields,
            isLaunchable,
            formFieldsIsWellFormed,
            restorableConfig,
            isRestorableConfigSaved,
            areAllFieldsDefault,
            chartName,
            chartIconUrl,
            launchScript,
            commandLogsEntries,
            chartSourceUrls,
            groupProjectName
        };
    }
);

export const selectors = { wrap };

export const privateSelectors = {
    releaseName
};
