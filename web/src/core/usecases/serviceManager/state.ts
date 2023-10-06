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
    };

    export type NotInitialized = Common & {
        stateDescription: "not initialized";
    };

    export type Ready = Common & {
        stateDescription: "ready";
        runningServices: RunningService[];
        envByServiceId: Record<string, Record<string, string>>;
        postInstallInstructionsByServiceId: Record<string, string>;
        kubernetesNamespace: string;
        commandLogsEntries: {
            cmdId: number;
            cmd: string;
            resp: string | undefined;
        }[];
    };
}

export type RunningService = RunningService.Owned | RunningService.NotOwned;

export declare namespace RunningService {
    export type Common = {
        id: string;
        packageName: string;
        friendlyName: string;
        logoUrl: string | undefined;
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
            "isUpdating": false
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
                envByServiceId: Record<string, Record<string, string>>;
                postInstallInstructionsByServiceId: Record<string, string>;
                kubernetesNamespace: string;
            }>
        ) => {
            const {
                runningServices,
                envByServiceId,
                postInstallInstructionsByServiceId,
                kubernetesNamespace
            } = payload;

            return id<State.Ready>({
                "stateDescription": "ready",
                "isUpdating": false,
                runningServices,
                envByServiceId,
                postInstallInstructionsByServiceId,
                kubernetesNamespace,
                "commandLogsEntries": (() => {
                    switch (state.stateDescription) {
                        case "ready":
                            return state.commandLogsEntries;
                        case "not initialized":
                            return [];
                    }
                })()
            });
        },
        "serviceStarted": (
            state,
            {
                payload
            }: PayloadAction<{
                serviceId: string;
                doOverwriteStaredAtToNow: boolean;
            }>
        ) => {
            const { serviceId, doOverwriteStaredAtToNow } = payload;

            assert(state.stateDescription === "ready");

            const { runningServices } = state;

            assert(runningServices !== undefined);

            const runningService = runningServices.find(({ id }) => id === serviceId);

            if (runningService === undefined) {
                return;
            }

            runningService.isStarting = false;

            if (doOverwriteStaredAtToNow) {
                //NOTE: Harmless hack to improve UI readability.
                runningService.startedAt = Date.now();
            }
        },
        "serviceStopped": (state, { payload }: PayloadAction<{ serviceId: string }>) => {
            const { serviceId } = payload;

            assert(state.stateDescription === "ready");

            const { runningServices } = state;
            assert(runningServices !== undefined);

            runningServices.splice(
                runningServices.findIndex(({ id }) => id === serviceId),
                1
            );
        },
        "postInstallInstructionsRequested": (
            state,
            { payload }: { payload: { serviceId: string } }
        ) => {
            const { serviceId } = payload;

            assert(state.stateDescription === "ready");

            const postInstallInstructions =
                state.postInstallInstructionsByServiceId[serviceId];

            assert(postInstallInstructions !== undefined);

            state.commandLogsEntries.push({
                "cmdId": Date.now(),
                "cmd": `helm get notes ${serviceId} --namespace ${state.kubernetesNamespace}`,
                "resp": postInstallInstructions
            });
        },
        "envRequested": (state, { payload }: { payload: { serviceId: string } }) => {
            const { serviceId } = payload;

            assert(state.stateDescription === "ready");

            const env = state.envByServiceId[serviceId];

            state.commandLogsEntries.push({
                "cmdId": Date.now(),
                "cmd": `helm get values ${serviceId} --namespace ${state.kubernetesNamespace}`,
                "resp": ["USER-SUPPLIED VALUES:", yaml.stringify(nestObject(env))].join(
                    "\n"
                )
            });
        }
    }
});
