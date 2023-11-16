import { createSlice } from "@reduxjs/toolkit";
import { id } from "tsafe/id";
import { assert, type Equals } from "tsafe/assert";
import { same } from "evt/tools/inDepth/same";
import { type FormFieldValue } from "./FormField";
import { type JSONSchemaObject } from "core/ports/OnyxiaApi";
import type { FormField } from "./FormField";
import { type LocalizedString } from "core/ports/OnyxiaApi";

type State = State.NotInitialized | State.Ready;

export declare namespace State {
    export type NotInitialized = {
        stateDescription: "not initialized";
        isInitializing: boolean;
    };

    export type Ready = {
        stateDescription: "ready";
        chartIconUrl: string | undefined;
        catalogId: string;
        catalogName: LocalizedString;
        catalogRepositoryUrl: string;
        chartName: string;
        chartVersion: string;
        // NOTE: Just for knowing if we need to display --version in the helm command bar
        defaultChartVersion: string;
        availableChartVersions: string[];
        chartSourceUrls: string[];
        pathOfFormFieldsWhoseValuesAreDifferentFromDefault: {
            path: string[];
        }[];
        formFields: FormField[];
        infosAboutWhenFieldsShouldBeHidden: {
            path: string[];
            isHidden: boolean | FormFieldValue;
        }[];
        defaultFormFieldsValue: FormFieldValue[];
        nonLibraryChartDependencies: string[];
        valuesSchema: JSONSchemaObject;
        k8sRandomSubdomain: string;
    };
}

export const name = "launcher";

export const { reducer, actions } = createSlice({
    name,
    "initialState": id<State>(
        id<State.NotInitialized>({
            "stateDescription": "not initialized",
            "isInitializing": false
        })
    ),
    "reducers": (() => {
        const reducers = {
            "initializationStarted": state => {
                assert(state.stateDescription === "not initialized");
                state.isInitializing = true;
            },
            "initialized": (
                state,
                {
                    payload
                }: {
                    payload: {
                        catalogId: string;
                        catalogName: LocalizedString;
                        catalogRepositoryUrl: string;
                        chartName: string;
                        chartVersion: string;
                        defaultChartVersion: string;
                        availableChartVersions: string[];
                        chartIconUrl: string | undefined;
                        chartSourceUrls: string[];
                        formFields: State.Ready["formFields"];
                        infosAboutWhenFieldsShouldBeHidden: State.Ready["infosAboutWhenFieldsShouldBeHidden"];
                        valuesSchema: State.Ready["valuesSchema"];
                        nonLibraryChartDependencies: string[];
                        formFieldsValueDifferentFromDefault: FormFieldValue[];
                        sensitiveConfigurations: FormFieldValue[];
                        k8sRandomSubdomain: string;
                    };
                }
            ) => {
                const {
                    catalogId,
                    catalogName,
                    catalogRepositoryUrl,
                    chartName,
                    chartVersion,
                    defaultChartVersion,
                    availableChartVersions,
                    chartIconUrl,
                    chartSourceUrls,
                    formFields,
                    infosAboutWhenFieldsShouldBeHidden,
                    valuesSchema,
                    nonLibraryChartDependencies,
                    formFieldsValueDifferentFromDefault,
                    k8sRandomSubdomain
                } = payload;

                Object.assign(
                    state,
                    id<State.Ready>({
                        "stateDescription": "ready",
                        catalogId,
                        catalogName,
                        catalogRepositoryUrl,
                        chartName,
                        chartVersion,
                        defaultChartVersion,
                        availableChartVersions,
                        chartIconUrl,
                        chartSourceUrls,
                        formFields,
                        infosAboutWhenFieldsShouldBeHidden,
                        "defaultFormFieldsValue": formFields.map(({ path, value }) => ({
                            path,
                            value
                        })),
                        nonLibraryChartDependencies,
                        "pathOfFormFieldsWhoseValuesAreDifferentFromDefault": [],
                        valuesSchema,
                        k8sRandomSubdomain
                    })
                );

                assert(state.stateDescription === "ready");

                formFieldsValueDifferentFromDefault.forEach(formFieldValue =>
                    reducers.formFieldValueChanged(state, {
                        "payload": { formFieldValue }
                    })
                );
            },
            "reset": () =>
                id<State.NotInitialized>({
                    "stateDescription": "not initialized",
                    "isInitializing": false
                }),
            "formFieldValueChanged": (
                state,
                { payload }: { payload: { formFieldValue: FormFieldValue } }
            ) => {
                assert(state.stateDescription === "ready");

                const { formFieldValue } = payload;

                const { path, value } = formFieldValue;

                {
                    const formField = state.formFields.find(formField =>
                        same(formField.path, path)
                    );

                    if (formField === undefined) {
                        // NOTE: Can happen when restoring config in a different chart version
                        return;
                    }

                    const areTypesConsistent = (() => {
                        switch (formField.type) {
                            case "boolean":
                            case "integer":
                            case "text":
                            case "password":
                            case "slider":
                                return (
                                    typeof formField.value === typeof formFieldValue.value
                                );
                            case "array":
                                return formFieldValue.value instanceof Array;
                            case "enum":
                                return (
                                    typeof formFieldValue.value === "string" &&
                                    formField.enum.includes(formFieldValue.value)
                                );
                            case "object":
                                assert<
                                    Equals<
                                        typeof formField.value,
                                        {
                                            type: "yaml";
                                            yamlStr: string;
                                        }
                                    >
                                >();
                                return (
                                    formFieldValue.value instanceof Object &&
                                    "yaml" in formFieldValue.value
                                );
                        }

                        assert<Equals<typeof formField, never>>();
                    })();

                    if (!areTypesConsistent) {
                        // NOTE: Can happen when restoring config in a different chart version
                        return;
                    }

                    if (same(formField.value, value)) {
                        return;
                    }

                    formField.value = value;
                }

                {
                    const { pathOfFormFieldsWhoseValuesAreDifferentFromDefault } = state;

                    if (
                        state.defaultFormFieldsValue.find(formField =>
                            same(formField.path, path)
                        )!.value !== value
                    ) {
                        if (
                            !pathOfFormFieldsWhoseValuesAreDifferentFromDefault.find(
                                ({ path: path_i }) => same(path_i, path)
                            )
                        ) {
                            pathOfFormFieldsWhoseValuesAreDifferentFromDefault.push({
                                path
                            });
                        }
                    } else {
                        const index =
                            pathOfFormFieldsWhoseValuesAreDifferentFromDefault.findIndex(
                                ({ path: path_i }) => same(path_i, path)
                            );

                        if (index >= 0) {
                            pathOfFormFieldsWhoseValuesAreDifferentFromDefault.splice(
                                index,
                                1
                            );
                        }
                    }
                }
            },
            "launchStarted": () => {
                /* NOTE: For coreEvt */
            },
            "launchCompleted": () => {
                /* NOTE: For coreEvt */
            },
            "defaultChartVersionSelected": () => {
                /* Only for evt */
            }
        } satisfies Record<string, (state: State, ...rest: any[]) => State | void>;

        return reducers;
    })()
});
