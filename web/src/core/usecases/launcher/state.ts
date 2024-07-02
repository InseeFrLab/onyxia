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
        s3ConfigurationOptions: {
            optionValue: string;
            helmValuesPatch: {
                helmValuesPath: (string | number)[];
                value: StringifyableAtomic;
            }[];
            dataSource: string;
            accountFriendlyName: string | undefined;
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
                        s3ConfigurationOptions: State.Ready["s3ConfigurationOptions"];
                        defaultLauncherS3ConfigurationOptionValue: string | undefined;
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
                    s3ConfigurationOptions,
                    defaultLauncherS3ConfigurationOptionValue,
                    helmValuesSchema,
                    defaultHelmValues,
                    isPersonalProject,
                    restorableConfig
                } = payload;

                const readyState: State.Ready = {
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
                    s3ConfigurationOptions,
                    helmValuesSchema,
                    defaultHelmValues,
                    "helmValues": defaultHelmValues
                };

                if (defaultLauncherS3ConfigurationOptionValue !== undefined) {
                    reducers.s3ConfigChanged(readyState, {
                        "payload": {
                            "optionValue": defaultLauncherS3ConfigurationOptionValue
                        }
                    });
                }

                if (restorableConfig !== undefined) {
                    restorableConfig.helmValuesPatch.forEach(({ path, value }) =>
                        assignValueAtPath(readyState.helmValues, path, value)
                    );
                }

                return readyState;
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
            "s3ConfigChanged": (
                state,
                {
                    payload
                }: {
                    payload: {
                        optionValue: string;
                    };
                }
            ) => {
                assert(state.stateDescription === "ready");

                const { optionValue } = payload;

                const option = state.s3ConfigurationOptions.find(
                    option => option.optionValue === optionValue
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
