import { assert } from "tsafe/assert";
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
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
        envByReleaseName: Record<string, Record<string, string>>;
        postInstallInstructionsByReleaseName: Record<string, string>;
        kubernetesNamespace: string;
    };
}

export type RunningService = RunningService.Owned | RunningService.NotOwned;

export declare namespace RunningService {
    export type Common = {
        releaseName: string;
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

export const { reducer, actions } = createSlice({
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
            }: PayloadAction<{
                runningServices: RunningService[];
                envByReleaseName: Record<string, Record<string, string>>;
                postInstallInstructionsByReleaseName: Record<string, string>;
                kubernetesNamespace: string;
            }>
        ) => {
            const {
                runningServices,
                envByReleaseName,
                postInstallInstructionsByReleaseName,
                kubernetesNamespace
            } = payload;

            return id<State.Ready>({
                "stateDescription": "ready",
                "isUpdating": false,
                runningServices,
                envByReleaseName,
                postInstallInstructionsByReleaseName,
                kubernetesNamespace,
                "commandLogsEntries": state.commandLogsEntries
            });
        },
        "serviceStarted": (
            state,
            {
                payload
            }: PayloadAction<{
                releaseName: string;
                doOverwriteStaredAtToNow: boolean;
            }>
        ) => {
            const { releaseName, doOverwriteStaredAtToNow } = payload;

            assert(state.stateDescription === "ready");

            const { runningServices } = state;

            assert(runningServices !== undefined);

            const runningService = runningServices.find(
                runningService => runningService.releaseName === releaseName
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
            { payload }: PayloadAction<{ releaseName: string }>
        ) => {
            const { releaseName } = payload;

            assert(state.stateDescription === "ready");

            const { runningServices } = state;
            assert(runningServices !== undefined);

            runningServices.splice(
                runningServices.findIndex(
                    runningServices => runningServices.releaseName === releaseName
                ),
                1
            );
        },
        "postInstallInstructionsRequested": (
            state,
            { payload }: { payload: { releaseName: string } }
        ) => {
            const { releaseName } = payload;

            assert(state.stateDescription === "ready");

            const postInstallInstructions =
                state.postInstallInstructionsByReleaseName[releaseName];

            assert(postInstallInstructions !== undefined);

            state.commandLogsEntries.push({
                "cmdId": Date.now(),
                "cmd": `helm get notes ${releaseName} --namespace ${state.kubernetesNamespace}`,
                "resp": postInstallInstructions
            });
        },
        "envRequested": (state, { payload }: { payload: { releaseName: string } }) => {
            const { releaseName } = payload;

            assert(state.stateDescription === "ready");

            const env = state.envByReleaseName[releaseName];

            state.commandLogsEntries.push({
                "cmdId": Date.now(),
                "cmd": `helm get values ${releaseName} --namespace ${state.kubernetesNamespace}`,
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
