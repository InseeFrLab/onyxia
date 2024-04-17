import { assert } from "tsafe/assert";
import { createUsecaseActions } from "clean-architecture";
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
        helmReleaseName: string;
        helmReleaseFriendlyName: string;
        logsByPodName: Record<string, string>;
        helmValues: Record<string, string>;
        monitoringUrl: string | undefined;
        commandLogsEntries: {
            cmdId: number;
            cmd: string;
            resp: "";
        }[];
    };
}

export const name = "serviceDetails";

export const { reducer, actions } = createUsecaseActions({
    name,
    "initialState": id<State>(
        id<State.NotInitialized.Idling>({
            "stateDescription": "not initialized",
            "isFetching": false
        })
    ),
    "reducers": {
        "updateStarted": (
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
                "stateDescription": "not initialized",
                "isFetching": true,
                helmReleaseName
            });
        },
        "updateCompleted": (
            state,
            {
                payload
            }: {
                payload: {
                    helmReleaseFriendlyName: string;
                    logsByPodName: Record<string, string>;
                    helmValues: Record<string, string>;
                    monitoringUrl: string | undefined;
                };
            }
        ) => {
            const { helmReleaseFriendlyName, logsByPodName, helmValues, monitoringUrl } =
                payload;

            assert(
                state.stateDescription !== "not initialized" || state.isFetching === true
            );

            const { helmReleaseName } = state;

            return id<State.Ready>({
                "stateDescription": "ready",
                "isFetching": false,
                helmReleaseName,
                helmReleaseFriendlyName,
                logsByPodName,
                helmValues,
                monitoringUrl,
                "commandLogsEntries":
                    state.stateDescription === "ready" ? state.commandLogsEntries : []
            });
        },
        "notifyHelmReleaseNoLongerExists": () => {},
        "commandLogsEntryAdded": (
            state,
            {
                payload
            }: {
                payload: {
                    cmd: string;
                };
            }
        ) => {
            const { cmd } = payload;

            assert(state.stateDescription === "ready");

            state.commandLogsEntries.push({
                "cmdId": Date.now(),
                cmd,
                "resp": ""
            });
        }
    }
});
