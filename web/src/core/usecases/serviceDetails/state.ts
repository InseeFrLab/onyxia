import { assert } from "tsafe/assert";
import {
    createUsecaseActions,
    createObjectThatThrowsIfAccessed
} from "clean-architecture";
import { id } from "tsafe/id";

export type State = State.NotInitialized | State.Ready;

export namespace State {
    export type NotInitialized = NotInitialized.Idling | NotInitialized.Fetching;

    export namespace NotInitialized {
        type Common = {
            stateDescription: "not initialized";
        };

        export type Idling = Common & {
            isFetching: false;
        };

        export type Fetching = Common & {
            isFetching: true;
            helmReleaseName: string;
        };
    }

    export type Ready = {
        stateDescription: "ready";
        isFetching: boolean;
        podNames: string[];
        selectedPodName: string;
        helmReleaseName: string;
        helmReleaseFriendlyName: string;
        helmValues: Record<string, string>;
        monitoringUrl: string | undefined;
        isCommandBarExpanded: boolean;
        commandLogsEntry: {
            cmdId: number;
            cmd: string;
            resp: string;
        };
    };
}

export const name = "serviceDetails";

export const { reducer, actions } = createUsecaseActions({
    name,
    initialState: id<State>(
        id<State.NotInitialized.Idling>({
            stateDescription: "not initialized",
            isFetching: false
        })
    ),
    reducers: (() => {
        const reducers = {
            updateStarted: (
                state,
                {
                    payload
                }: {
                    payload: {
                        helmReleaseName: string;
                    };
                }
            ) => {
                const { helmReleaseName } = payload;

                if (
                    state.stateDescription === "ready" &&
                    state.helmReleaseName === helmReleaseName
                ) {
                    state.isFetching = true;
                    return;
                }

                return id<State.NotInitialized.Fetching>({
                    stateDescription: "not initialized",
                    isFetching: true,
                    helmReleaseName
                });
            },
            updateCompleted: (
                state,
                {
                    payload
                }: {
                    payload: {
                        helmReleaseFriendlyName: string;
                        podNames: string[];
                        helmValues: Record<string, string>;
                        monitoringUrl: string | undefined;
                    };
                }
            ) => {
                const { helmReleaseFriendlyName, podNames, helmValues, monitoringUrl } =
                    payload;

                assert(
                    state.stateDescription !== "not initialized" ||
                        state.isFetching === true
                );

                const newState = id<State.Ready>({
                    stateDescription: "ready",
                    isFetching: false,
                    helmReleaseName: state.helmReleaseName,
                    helmReleaseFriendlyName,
                    podNames,
                    selectedPodName:
                        state.stateDescription === "ready"
                            ? podNames.includes(state.selectedPodName)
                                ? state.selectedPodName
                                : ""
                            : "",
                    helmValues,
                    monitoringUrl,
                    isCommandBarExpanded:
                        state.stateDescription === "ready"
                            ? state.isCommandBarExpanded
                            : false,
                    commandLogsEntry:
                        state.stateDescription === "ready"
                            ? state.commandLogsEntry
                            : createObjectThatThrowsIfAccessed<
                                  State.Ready["commandLogsEntry"]
                              >()
                });

                if (state.stateDescription !== "ready") {
                    reducers.selectedPodChanged(newState, {
                        payload: { podName: podNames[0] }
                    });
                }

                return newState;
            },
            selectedPodChanged: (
                state,
                {
                    payload
                }: {
                    payload: {
                        podName: string;
                    };
                }
            ) => {
                const { podName } = payload;

                assert(state.stateDescription === "ready");

                state.selectedPodName = podName;

                state.commandLogsEntry = {
                    cmdId: Date.now(),
                    cmd: `kubectl logs ${podName}`,
                    resp: ""
                };
            },
            helmGetValueShown: (
                state,
                {
                    payload
                }: {
                    payload: {
                        cmdResp: string;
                    };
                }
            ) => {
                const { cmdResp } = payload;

                assert(state.stateDescription === "ready");

                state.commandLogsEntry = {
                    cmdId: Date.now(),
                    cmd: `helm get values ${state.helmReleaseName}`,
                    resp: cmdResp
                };

                state.isCommandBarExpanded = true;
            },
            notifyHelmReleaseNoLongerExists: () => {},
            commandBarCollapsed: state => {
                assert(state.stateDescription === "ready");
                state.isCommandBarExpanded = false;
            }
        } satisfies Record<string, (state: State, ...rest: any[]) => State | void>;

        return reducers;
    })()
});
