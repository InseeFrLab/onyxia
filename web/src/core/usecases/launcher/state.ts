import { id } from "tsafe/id";
import { assert, type Equals } from "tsafe/assert";
import { same } from "evt/tools/inDepth/same";
import { type FormFieldValue } from "./FormField";
import { type JSONSchemaObject } from "core/ports/OnyxiaApi";
import type { FormField } from "./FormField";
import { type LocalizedString } from "core/ports/OnyxiaApi";
import { createUsecaseActions } from "clean-architecture";

type State = State.NotInitialized | State.Ready;

export declare namespace State {
    export type NotInitialized = {
        stateDescription: "not initialized";
        isInitializing: boolean;
    };

    export type Ready = {
        stateDescription: "ready";
        friendlyName: string;
        isShared: boolean | undefined;
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
        pathOfFormFieldsAffectedByS3ConfigChange: {
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
        selectedCustomS3ConfigIndex: number | undefined;
        has3sConfigBeenManuallyChanged: boolean;
    };
}

export const name = "launcher";

export const { reducer, actions } = createUsecaseActions({
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
                        friendlyName: string;
                        isShared: boolean | undefined;
                        catalogId: string;
                        catalogName: LocalizedString;
                        catalogRepositoryUrl: string;
                        chartName: string;
                        chartVersion: string;
                        defaultChartVersion: string;
                        availableChartVersions: string[];
                        chartIconUrl: string | undefined;
                        chartSourceUrls: string[];
                        pathOfFormFieldsAffectedByS3ConfigChange: State.Ready["pathOfFormFieldsAffectedByS3ConfigChange"];
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
                    friendlyName,
                    isShared,
                    catalogId,
                    catalogName,
                    catalogRepositoryUrl,
                    chartName,
                    chartVersion,
                    defaultChartVersion,
                    availableChartVersions,
                    chartIconUrl,
                    chartSourceUrls,
                    pathOfFormFieldsAffectedByS3ConfigChange,
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
                        pathOfFormFieldsAffectedByS3ConfigChange,
                        formFields,
                        infosAboutWhenFieldsShouldBeHidden,
                        "defaultFormFieldsValue": formFields.map(({ path, value }) => ({
                            path,
                            value
                        })),
                        nonLibraryChartDependencies,
                        "pathOfFormFieldsWhoseValuesAreDifferentFromDefault": [],
                        valuesSchema,
                        k8sRandomSubdomain,
                        "selectedCustomS3ConfigIndex": undefined,
                        "has3sConfigBeenManuallyChanged": false,
                        friendlyName,
                        isShared
                    })
                );

                assert(state.stateDescription === "ready");

                formFieldsValueDifferentFromDefault.forEach(formFieldValue =>
                    reducers.formFieldValueChanged(state, {
                        "payload": { formFieldValue }
                    })
                );
            },
            "allDefaultRestored": state => {
                assert(state.stateDescription === "ready");

                state.defaultFormFieldsValue.forEach(({ path, value }) =>
                    reducers.formFieldValueChanged(state, {
                        "payload": {
                            "formFieldValue": {
                                path,
                                value
                            }
                        }
                    })
                );
            },
            "s3ConfigChanged": (
                state,
                {
                    payload
                }: {
                    payload:
                        | {
                              customS3ConfigIndex: number;
                              formFieldsValue: FormFieldValue[];
                          }
                        | {
                              customS3ConfigIndex: undefined;
                              formFieldsValue?: never;
                          };
                }
            ) => {
                const { customS3ConfigIndex, formFieldsValue } = payload;

                assert(state.stateDescription === "ready");

                state.selectedCustomS3ConfigIndex = customS3ConfigIndex;

                (formFieldsValue ?? state.defaultFormFieldsValue)
                    .filter(
                        ({ path }) =>
                            state.pathOfFormFieldsAffectedByS3ConfigChange.find(
                                ({ path: pathToCheck }) => same(path, pathToCheck)
                            ) !== undefined
                    )
                    .forEach(({ path, value }) =>
                        reducers.formFieldValueChanged(state, {
                            "payload": {
                                "formFieldValue": {
                                    path,
                                    value
                                }
                            }
                        })
                    );

                state.has3sConfigBeenManuallyChanged = false;
            },
            "resetToNotInitialized": () =>
                id<State.NotInitialized>({
                    "stateDescription": "not initialized",
                    "isInitializing": false
                }),
            "formFieldValueChanged": (
                state,
                {
                    payload
                }: {
                    payload: {
                        formFieldValue: FormFieldValue;
                    };
                }
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
                                    "type" in formFieldValue.value &&
                                    formFieldValue.value.type === "yaml"
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

                if (
                    state.pathOfFormFieldsAffectedByS3ConfigChange.find(
                        ({ path: pathAffectedByS3Config }) =>
                            same(path, pathAffectedByS3Config)
                    ) !== undefined
                ) {
                    state.has3sConfigBeenManuallyChanged = true;
                }

                {
                    const { pathOfFormFieldsWhoseValuesAreDifferentFromDefault } = state;

                    if (
                        !same(
                            state.defaultFormFieldsValue.find(formField =>
                                same(formField.path, path)
                            )!.value,
                            value
                        )
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
            "friendlyNameChanged": (
                state,
                {
                    payload
                }: {
                    payload: {
                        friendlyName: string;
                    };
                }
            ) => {
                const { friendlyName } = payload;

                assert(state.stateDescription === "ready");

                state.friendlyName = friendlyName;
            },
            "isSharedChanged": (
                state,
                {
                    payload
                }: {
                    payload: {
                        isShared: boolean | undefined;
                    };
                }
            ) => {
                const { isShared } = payload;

                assert(state.stateDescription === "ready");

                state.isShared = isShared;
            },
            "launchStarted": () => {
                /* NOTE: For coreEvt */
            },
            "launchCompleted": () => {
                /* NOTE: For coreEvt */
            }
        } satisfies Record<string, (state: State, ...rest: any[]) => State | void>;

        return reducers;
    })()
});
