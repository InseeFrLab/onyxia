import { createSlice } from "@reduxjs/toolkit";
import { id } from "tsafe/id";
import { assert } from "tsafe/assert";
import { same } from "evt/tools/inDepth/same";
import { type FormFieldValue } from "./FormField";
import { type JSONSchemaObject } from "core/ports/OnyxiaApi";
import type { FormField } from "./FormField";

type State = State.NotInitialized | State.Ready;

export declare namespace State {
    export type NotInitialized = {
        stateDescription: "not initialized";
        isInitializing: boolean;
    };

    export type Ready = {
        stateDescription: "ready";
        icon: string | undefined;
        catalogId: string;
        catalogLocation: string;
        packageName: string;
        sources: string[];
        pathOfFormFieldsWhoseValuesAreDifferentFromDefault: {
            path: string[];
        }[];
        formFields: FormField[];
        infosAboutWhenFieldsShouldBeHidden: {
            path: string[];
            isHidden: boolean | FormFieldValue;
        }[];
        defaultFormFieldsValue: FormFieldValue[];
        dependencies?: string[];
        config: JSONSchemaObject;
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
                        catalogLocation: string;
                        catalogId: string;
                        packageName: string;
                        icon: string | undefined;
                        sources: string[];
                        formFields: State.Ready["formFields"];
                        infosAboutWhenFieldsShouldBeHidden: State.Ready["infosAboutWhenFieldsShouldBeHidden"];
                        config: State.Ready["config"];
                        dependencies: string[];
                        formFieldsValueDifferentFromDefault: FormFieldValue[];
                        sensitiveConfigurations: FormFieldValue[];
                    };
                }
            ) => {
                const {
                    catalogLocation,
                    catalogId,
                    packageName,
                    icon,
                    sources,
                    formFields,
                    infosAboutWhenFieldsShouldBeHidden,
                    config,
                    dependencies,
                    formFieldsValueDifferentFromDefault
                } = payload;

                Object.assign(
                    state,
                    id<State.Ready>({
                        "stateDescription": "ready",
                        catalogId,
                        catalogLocation,
                        packageName,
                        icon,
                        sources,
                        formFields,
                        infosAboutWhenFieldsShouldBeHidden,
                        "defaultFormFieldsValue": formFields.map(({ path, value }) => ({
                            path,
                            value
                        })),
                        dependencies,
                        "pathOfFormFieldsWhoseValuesAreDifferentFromDefault": [],
                        config
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
                    )!;

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
            "launchCompleted": (_state, _: { payload: { serviceId: string } }) => {
                /* NOTE: For coreEvt */
            }
        } satisfies Record<string, (state: State, ...rest: any[]) => State | void>;

        return reducers;
    })()
});
