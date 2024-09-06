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
import { mutateHelmValues, type FormFieldValue } from "./decoupledLogic";

type State = State.NotInitialized | State.Ready;

export declare namespace State {
    export type NotInitialized = {
        stateDescription: "not initialized";
        isInitializing: boolean;
    };

    export type Ready = {
        stateDescription: "ready";
        catalogId: string;
        chartName: string;
        chartVersion: string;
        chartVersion_default: string;
        xOnyxiaContext: XOnyxiaContext;

        friendlyName: string;
        friendlyName_default: string;
        isShared: boolean | undefined;
        isShared_default: boolean | undefined;
        s3Config:
            | { isChartUsingS3: false }
            | {
                  isChartUsingS3: true;
                  s3ConfigId: string | undefined;
                  s3ConfigId_default: string | undefined;
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

        chartIconUrl: string | undefined;
        catalogRepositoryUrl: string;
        catalogName: LocalizedString;
        k8sRandomSubdomain: string;
        helmChartSourceUrls: string[];
        availableChartVersions: string[];
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
                _,
                {
                    payload
                }: {
                    payload: {
                        readyState: Omit<State.Ready, "stateDescription" | "helmValues">;
                        helmValuesPatch: {
                            path: (string | number)[];
                            value: StringifyableAtomic | undefined;
                        }[];
                    };
                }
            ) => {
                const { readyState: readyState_partial, helmValuesPatch } = payload;

                const state: State.Ready = {
                    "stateDescription": "ready",
                    ...readyState_partial,
                    "helmValues": structuredClone(readyState_partial.helmValues_default)
                };

                applyDiffPatch({
                    "objectOrArray": state.helmValues,
                    "diffPatch": helmValuesPatch
                });

                return state;
            },
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
                const { formFieldValue } = payload;

                assert(state.stateDescription === "ready");

                const { helmValues, helmValuesSchema } = state;

                mutateHelmValues({
                    helmValues,
                    helmValuesSchema,
                    "action": {
                        "name": "update value",
                        formFieldValue
                    }
                });
            },
            "arrayItemAdded": (
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

                const { helmValues, helmValuesSchema } = state;

                mutateHelmValues({
                    helmValues,
                    helmValuesSchema,
                    "action": {
                        "name": "add array item",
                        helmValuesPath
                    }
                });
            },
            "arrayItemRemoved": (
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

                const { helmValues, helmValuesSchema } = state;

                mutateHelmValues({
                    helmValues,
                    helmValuesSchema,
                    "action": {
                        "name": "remove array item",
                        helmValuesPath,
                        index
                    }
                });
            },
            "resetToNotInitialized": () =>
                id<State.NotInitialized>({
                    "stateDescription": "not initialized",
                    "isInitializing": false
                }),
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
