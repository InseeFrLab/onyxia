import { id } from "tsafe/id";
import { assert } from "tsafe/assert";
import type { JSONSchema } from "core/ports/OnyxiaApi";
import type { LocalizedString } from "core/ports/OnyxiaApi";
import { createUsecaseActions } from "clean-architecture";
import {
    type Stringifyable,
    type StringifyableAtomic,
    applyDiffPatch
} from "core/tools/Stringifyable";
import structuredClone from "@ungap/structured-clone";
import type { Omit } from "core/tools/Omit";
import type { XOnyxiaContext } from "core/ports/OnyxiaApi";
import {
    type FormFieldValue,
    type RootForm,
    mutateHelmValues_addArrayItem,
    mutateHelmValues_removeArrayItem,
    mutateHelmValues_update,
    computeAutocompleteOptions
} from "./decoupledLogic";
import { same } from "evt/tools/inDepth/same";
import { assignValueAtPath } from "core/tools/Stringifyable";
import type { DeepPartial } from "core/tools/DeepPartial";

type State = State.NotInitialized | State.Ready;

export declare namespace State {
    export type NotInitialized = {
        stateDescription: "not initialized";
    };

    export type Ready = {
        stateDescription: "ready";
        catalogId: string;
        chartName: string;
        chartVersion: string;
        chartVersion_default: string;
        xOnyxiaContext: XOnyxiaContext;
        xOnyxiaContext_autocompleteOptions: DeepPartial<XOnyxiaContext>;

        friendlyName: string;
        friendlyName_default: string;
        isShared: boolean | undefined;
        isShared_default: boolean | undefined;
        s3Config:
            | { isChartUsingS3: false }
            | {
                  isChartUsingS3: true;
                  s3ProfileName: string | undefined;
                  s3ProfileName_default: string | undefined;
              };

        helmDependencies: {
            helmRepositoryUrl: string;
            chartName: string;
            chartVersion: string;
            condition: (string | number)[] | undefined;
        }[];
        helmValuesSchema: JSONSchema;
        helmValues_default: Record<string, Stringifyable>;
        helmValues: Record<string, Stringifyable>;
        helmValuesYaml: string;

        helmValuesSchema_forDataTextEditor: JSONSchema | undefined;

        chartIconUrl: string | undefined;
        catalogRepositoryUrl: string;
        catalogName: LocalizedString;
        k8sRandomSubdomain: string;
        helmChartSourceUrls: string[];
        availableChartVersions: string[];

        infoAmountInHelmValues: "user provided" | "include values.yaml defaults";

        autocompleteOptions: {
            helmValuesPath: (string | number)[];
            options: {
                optionValue: string;
                overwrite: {
                    helmValuesPath: (string | number)[];
                    helmValues_subtree: Stringifyable;
                };
            }[];
        }[];
    };
}

export const name = "launcher";

export const { reducer, actions } = createUsecaseActions({
    name,
    initialState: id<State>(
        id<State.NotInitialized>({
            stateDescription: "not initialized"
        })
    ),
    reducers: (() => {
        const reducers = {
            resetToNotInitialized: () =>
                id<State.NotInitialized>({ stateDescription: "not initialized" }),
            initialized: (
                _,
                {
                    payload
                }: {
                    payload: {
                        readyState: Omit<
                            State.Ready,
                            "stateDescription" | "helmValues" | "autocompleteOptions"
                        >;
                        helmValuesPatch: {
                            path: (string | number)[];
                            value: StringifyableAtomic | undefined;
                        }[];
                    };
                }
            ) => {
                const { readyState: readyState_partial, helmValuesPatch } = payload;

                const state: State.Ready = {
                    stateDescription: "ready",
                    ...readyState_partial,
                    helmValues: structuredClone(readyState_partial.helmValues_default),
                    autocompleteOptions: []
                };

                applyDiffPatch({
                    objectOrArray: state.helmValues,
                    diffPatch: helmValuesPatch
                });

                return state;
            },
            infoAmountInHelmValuesChanged: (
                state,
                {
                    payload
                }: {
                    payload: {
                        infoAmountInHelmValues:
                            | "user provided"
                            | "include values.yaml defaults";
                        helmValuesPatch: {
                            path: (string | number)[];
                            value: StringifyableAtomic | undefined;
                        }[];
                        helmValues_default: Record<string, Stringifyable>;
                    };
                }
            ) => {
                const { infoAmountInHelmValues, helmValuesPatch, helmValues_default } =
                    payload;

                assert(state.stateDescription === "ready");

                const helmValues = structuredClone(helmValues_default);

                applyDiffPatch({
                    objectOrArray: helmValues,
                    diffPatch: helmValuesPatch
                });

                state.helmValues_default = helmValues_default;
                state.helmValues = helmValues;
                state.infoAmountInHelmValues = infoAmountInHelmValues;
            },
            formFieldValueChanged: (
                state,
                {
                    payload
                }: {
                    payload: {
                        formFieldValue: FormFieldValue;
                        rootForm: RootForm;
                    };
                }
            ) => {
                const { formFieldValue, rootForm } = payload;

                assert(state.stateDescription === "ready");

                const { helmValues } = state;

                mutateHelmValues_update({
                    helmValues,
                    formFieldValue,
                    rootForm
                });
            },
            formFieldValueChanged_autocompleteSelection: (
                state,
                {
                    payload
                }: {
                    payload: {
                        helmValuesPath: (string | number)[];
                        optionValue: string;
                    };
                }
            ) => {
                const { helmValuesPath, optionValue } = payload;

                assert(state.stateDescription === "ready");

                const entry = state.autocompleteOptions.find(entry =>
                    same(entry.helmValuesPath, helmValuesPath)
                );

                assert(entry !== undefined);

                const option = entry.options.find(
                    option => option.optionValue === optionValue
                );

                assert(option !== undefined);

                const { overwrite } = option;

                assignValueAtPath({
                    stringifyableObjectOrArray: state.helmValues,
                    path: overwrite.helmValuesPath,
                    value: overwrite.helmValues_subtree
                });
            },
            autocompletePanelOpened: (
                state,
                { payload }: { payload: { helmValuesPath: (string | number)[] } }
            ) => {
                const { helmValuesPath } = payload;

                assert(state.stateDescription === "ready");

                const options = computeAutocompleteOptions({
                    helmValuesPath: helmValuesPath,
                    helmValues: state.helmValues,
                    helmValuesSchema: state.helmValuesSchema,
                    xOnyxiaContext: state.xOnyxiaContext,
                    xOnyxiaContext_autoCompleteOptions:
                        state.xOnyxiaContext_autocompleteOptions
                });

                state.autocompleteOptions = [
                    ...state.autocompleteOptions.filter(
                        entry => !same(entry.helmValuesPath, helmValuesPath)
                    ),
                    {
                        helmValuesPath,
                        options
                    }
                ];
            },
            helmValuesChanged: (
                state,
                {
                    payload
                }: {
                    payload: {
                        helmValues: Record<string, Stringifyable>;
                    };
                }
            ) => {
                const { helmValues } = payload;

                assert(state.stateDescription === "ready");

                state.helmValues = helmValues;
            },
            arrayItemAdded: (
                state,
                {
                    payload
                }: {
                    payload: {
                        helmValuesPath: (string | number)[];
                    };
                }
            ) => {
                const { helmValuesPath } = payload;

                assert(state.stateDescription === "ready");

                const { helmValues, helmValuesSchema, helmValuesYaml, xOnyxiaContext } =
                    state;

                mutateHelmValues_addArrayItem({
                    helmValues,
                    helmValuesSchema,
                    xOnyxiaContext,
                    helmValuesPath,
                    helmValuesYaml
                });
            },
            arrayItemRemoved: (
                state,
                {
                    payload
                }: {
                    payload: {
                        helmValuesPath: (string | number)[];
                        index: number;
                    };
                }
            ) => {
                const { helmValuesPath, index } = payload;

                assert(state.stateDescription === "ready");

                const { helmValues } = state;

                mutateHelmValues_removeArrayItem({
                    helmValues,
                    helmValuesPath,
                    index
                });
            },
            friendlyNameChanged: (
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
            isSharedChanged: (
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
            launchStarted: () => {
                /* NOTE: For coreEvt */
            },
            launchCompleted: () => {
                /* NOTE: For coreEvt */
            }
        } satisfies Record<string, (state: State, ...rest: any[]) => State | void>;

        return reducers;
    })()
});
