import { assert } from "tsafe/assert";
import { createUsecaseActions } from "redux-clean-architecture";
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
        isStarting: boolean;
        startedAt: number;
        /** Undefined if the service don't use the token */
        vaultTokenExpirationTime: number | undefined;
        s3TokenExpirationTime: number | undefined;
        urls: string[];
        hasPostInstallInstructions: boolean;
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

export const name = "serviceManager";

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
        "serviceStarted": (
            state,
            {
                payload
            }: {
                payload: {
                    helmReleaseName: string;
                    doOverwriteStaredAtToNow: boolean;
                };
            }
        ) => {
            const { helmReleaseName, doOverwriteStaredAtToNow } = payload;

            assert(state.stateDescription === "ready");

            const { runningServices } = state;

            assert(runningServices !== undefined);

            const runningService = runningServices.find(
                runningService => runningService.helmReleaseName === helmReleaseName
            );

            if (runningService === undefined) {
                return;
            }

            runningService.isStarting = false;

            if (doOverwriteStaredAtToNow) {
                //NOTE: Harmless hack to improve UI readability.
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
