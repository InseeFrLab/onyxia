import { id } from "tsafe/id";
import { assert } from "tsafe/assert";
import type { JSONSchema } from "core/ports/OnyxiaApi";
import type { LocalizedString } from "core/ports/OnyxiaApi";
import { createUsecaseActions } from "clean-architecture";
import { FormFieldValue } from "./formTypes";
import {
    type StringifyableObject,
    type StringifyableAtomic,
    assignValueAtPath
} from "core/tools/Stringifyable";
import type { ProjectConfigs } from "core/usecases/projectManagement";

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
        k8sRandomSubdomain: string;
        chartSourceUrls: string[];
        availableChartVersions: string[];
        s3Options: {
            optionValue: string;
            isSts: boolean;
            helmValuesPatch: {
                helmValuesPath: (string | number)[];
                value: StringifyableAtomic;
            }[];
            dataSource: string;
            friendlyName: string | undefined;
        }[];
        helmValuesSchema: JSONSchema;
        defaultHelmValues: StringifyableObject;
        helmValues: StringifyableObject;
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
                        friendlyName: string;
                        chartIconUrl: string | undefined;
                        catalogId: string;
                        catalogName: LocalizedString;
                        catalogRepositoryUrl: string;
                        chartName: string;
                        defaultChartVersion: string;
                        k8sRandomSubdomain: string;
                        chartSourceUrls: string[];
                        availableChartVersions: string[];
                        s3Options: State.Ready["s3Options"];
                        selectedS3OptionValue: string | undefined;
                        helmValuesSchema: JSONSchema;
                        defaultHelmValues: StringifyableObject;
                        isPersonalProject: boolean;
                        restorableConfig:
                            | Pick<
                                  ProjectConfigs.RestorableServiceConfig,
                                  | "isShared"
                                  | "chartVersion"
                                  | "friendlyName"
                                  | "helmValuesPatch"
                              >
                            | undefined;
                    };
                }
            ) => {
                const {
                    friendlyName,
                    chartIconUrl,
                    catalogId,
                    catalogName,
                    catalogRepositoryUrl,
                    chartName,
                    defaultChartVersion,
                    k8sRandomSubdomain,
                    chartSourceUrls,
                    availableChartVersions,
                    s3Options,
                    selectedS3OptionValue,
                    helmValuesSchema,
                    defaultHelmValues,
                    isPersonalProject,
                    restorableConfig
                } = payload;

                const state: State.Ready = {
                    "stateDescription": "ready",
                    "friendlyName": restorableConfig?.friendlyName ?? friendlyName,
                    "isShared":
                        restorableConfig?.isShared ?? isPersonalProject
                            ? undefined
                            : false,
                    chartIconUrl,
                    catalogId,
                    catalogName,
                    catalogRepositoryUrl,
                    chartName,
                    "chartVersion": restorableConfig?.chartVersion ?? defaultChartVersion,
                    defaultChartVersion,
                    k8sRandomSubdomain,
                    chartSourceUrls,
                    availableChartVersions,
                    s3Options,
                    helmValuesSchema,
                    defaultHelmValues,
                    "helmValues": defaultHelmValues
                };

                if (selectedS3OptionValue !== undefined) {
                    reducers.selectedS3OptionChanged(state, {
                        "payload": {
                            selectedS3OptionValue
                        }
                    });
                }

                if (restorableConfig !== undefined) {
                    restorableConfig.helmValuesPatch.forEach(({ path, value }) =>
                        assignValueAtPath(state.helmValues, path, value)
                    );
                }

                return state;
            },
            "allDefaultRestored": state => {
                assert(state.stateDescription === "ready");
                state.helmValues = state.defaultHelmValues;
                state.chartVersion = state.defaultChartVersion;
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

                /*
                (function callee(path, object: any){

                    assert(object instanceof Object || object instanceof Array);

                    const [first, ...rest]= path;

                    if(rest.length === 0){
                        object[first] = value;
                        return;
                    }

                    callee(rest, object[first]);

                })(helmValuesPath, state.helmValues);
                */
            },
            "selectedS3OptionChanged": (
                state,
                {
                    payload
                }: {
                    payload: {
                        selectedS3OptionValue: string;
                    };
                }
            ) => {
                assert(state.stateDescription === "ready");

                const { selectedS3OptionValue } = payload;

                const option = state.s3Options.find(
                    option => option.optionValue === selectedS3OptionValue
                );

                assert(option !== undefined);

                option.helmValuesPatch.forEach(({ helmValuesPath, value }) =>
                    assignValueAtPath(state.helmValues, helmValuesPath, value)
                );
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
