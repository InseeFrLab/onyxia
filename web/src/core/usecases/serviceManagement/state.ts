import { assert } from "tsafe/assert";
import { createUsecaseActions } from "clean-architecture";
import { id } from "tsafe/id";
import { nestObject } from "core/tools/nestObject";
import * as yaml from "yaml";

export type State = State.NotInitialized | State.Ready;

export namespace State {
    export type Common = {
        isUpdating: boolean;
        commandLogsEntries: {
            cmdId: number;
            cmd: string;
            resp: string | undefined;
        }[];
    };

    export type NotInitialized = Common & {
        stateDescription: "not initialized";
    };

    export type Ready = Common & {
        stateDescription: "ready";
        runningServices: RunningService[];
        envByHelmReleaseName: Record<string, Record<string, string>>;
        postInstallInstructionsByHelmReleaseName: Record<string, string>;
        kubernetesNamespace: string;
    };
}

export type RunningService = RunningService.Owned | RunningService.NotOwned;

export declare namespace RunningService {
    export type Common = {
        helmReleaseName: string;
        chartName: string;
        friendlyName: string;
        chartIconUrl: string | undefined;
        monitoringUrl: string | undefined;
        startedAt: number;
        urls: string[];
        hasPostInstallInstructions: boolean;
        status: "deployed" | "pending-install" | "failed";
        areAllTasksReady: boolean;
        isPausable: boolean;
        isPaused: boolean;
    };

    export type Owned = Common & {
        isShared: boolean;
        isOwned: true;
    };

    export type NotOwned = Common & {
        isShared: true;
        isOwned: false;
        ownerUsername: string;
    };
}

export const name = "serviceManagement";

export const { reducer, actions } = createUsecaseActions({
    name,
    "initialState": id<State>(
        id<State.NotInitialized>({
            "stateDescription": "not initialized",
            "isUpdating": false,
            "commandLogsEntries": []
        })
    ),
    "reducers": {
        "updateStarted": state => {
            state.isUpdating = true;
        },
        "updateCompleted": (
            state,
            {
                payload
            }: {
                payload: {
                    runningServices: RunningService[];
                    envByHelmReleaseName: Record<string, Record<string, string>>;
                    postInstallInstructionsByHelmReleaseName: Record<string, string>;
                    kubernetesNamespace: string;
                };
            }
        ) => {
            const {
                runningServices,
                envByHelmReleaseName,
                postInstallInstructionsByHelmReleaseName,
                kubernetesNamespace
            } = payload;

            return id<State.Ready>({
                "stateDescription": "ready",
                "isUpdating": false,
                runningServices,
                envByHelmReleaseName,
                postInstallInstructionsByHelmReleaseName,
                kubernetesNamespace,
                "commandLogsEntries": state.commandLogsEntries
            });
        },
        "statusUpdated": (
            state,
            {
                payload
            }: {
                payload: {
                    helmReleaseName: string;
                    status: "deployed" | "pending-install" | "failed";
                    areAllTasksReady: boolean;
                };
            }
        ) => {
            const { helmReleaseName, status, areAllTasksReady } = payload;

            assert(state.stateDescription === "ready");

            const { runningServices } = state;

            assert(runningServices !== undefined);

            const runningService = runningServices.find(
                runningService => runningService.helmReleaseName === helmReleaseName
            );

            if (runningService === undefined) {
                return;
            }

            runningService.status = status;
            runningService.areAllTasksReady = areAllTasksReady;

            //NOTE: Harmless hack to improve UI readability.
            if (status === "deployed" && areAllTasksReady) {
                runningService.startedAt = Date.now();
            }
        },
        "serviceStopped": (
            state,
            { payload }: { payload: { helmReleaseName: string } }
        ) => {
            const { helmReleaseName } = payload;

            assert(state.stateDescription === "ready");

            const { runningServices } = state;
            assert(runningServices !== undefined);

            runningServices.splice(
                runningServices.findIndex(
                    runningServices => runningServices.helmReleaseName === helmReleaseName
                ),
                1
            );
        },
        "startPausingOrResumingService": (
            state,
            { payload }: { payload: { helmReleaseName: string } }
        ) => {
            const { helmReleaseName } = payload;

            assert(state.stateDescription === "ready");

            const { runningServices } = state;
            assert(runningServices !== undefined);

            const runningService = runningServices.find(
                runningService => runningService.helmReleaseName === helmReleaseName
            );

            assert(runningService !== undefined);

            runningService.isPausable = false;
        },
        "servicePausedOrResumed": (
            state,
            { payload }: { payload: { helmReleaseName: string; isPaused: boolean } }
        ) => {
            const { helmReleaseName, isPaused } = payload;

            assert(state.stateDescription === "ready");

            const { runningServices } = state;
            assert(runningServices !== undefined);

            const runningService = runningServices.find(
                runningService => runningService.helmReleaseName === helmReleaseName
            );

            assert(runningService !== undefined);

            runningService.isPaused = isPaused;
            runningService.isPausable = true;
        },
        "postInstallInstructionsRequested": (
            state,
            { payload }: { payload: { helmReleaseName: string } }
        ) => {
            const { helmReleaseName } = payload;

            assert(state.stateDescription === "ready");

            const postInstallInstructions =
                state.postInstallInstructionsByHelmReleaseName[helmReleaseName];

            assert(postInstallInstructions !== undefined);

            state.commandLogsEntries.push({
                "cmdId": Date.now(),
                "cmd": `helm get notes ${helmReleaseName} --namespace ${state.kubernetesNamespace}`,
                "resp": postInstallInstructions
            });
        },
        "envRequested": (
            state,
            { payload }: { payload: { helmReleaseName: string } }
        ) => {
            const { helmReleaseName } = payload;

            assert(state.stateDescription === "ready");

            const env = state.envByHelmReleaseName[helmReleaseName];

            state.commandLogsEntries.push({
                "cmdId": Date.now(),
                "cmd": `helm get values ${helmReleaseName} --namespace ${state.kubernetesNamespace}`,
                "resp": ["USER-SUPPLIED VALUES:", yaml.stringify(nestObject(env))].join(
                    "\n"
                )
            });
        },
        "commandLogsEntryAdded": (
            state,
            {
                payload
            }: {
                payload: {
                    commandLogsEntry: {
                        cmdId: number;
                        cmd: string;
                        resp: string | undefined;
                    };
                };
            }
        ) => {
            const { commandLogsEntry } = payload;

            state.commandLogsEntries.push(commandLogsEntry);
        },
        "commandLogsRespUpdated": (
            state,
            {
                payload
            }: {
                payload: {
                    cmdId: number;
                    resp: string;
                };
            }
        ) => {
            const { cmdId, resp } = payload;

            const commandLogsEntry = state.commandLogsEntries.find(
                commandLogsEntry => commandLogsEntry.cmdId === cmdId
            );

            assert(commandLogsEntry !== undefined);

            commandLogsEntry.resp = resp;
        }
    }
});
