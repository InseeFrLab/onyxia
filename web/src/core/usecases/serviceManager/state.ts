import { assert } from "tsafe/assert";
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { id } from "tsafe/id";

type State = {
    isUpdating: boolean;
    runningServices: undefined | RunningService[];
};

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
        postInstallInstructions: string | undefined;
        env: Record<string, string>;
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
    "initialState": id<State>({
        "isUpdating": false,
        "runningServices": undefined
    }),
    "reducers": {
        "updateStarted": state => {
            state.isUpdating = true;
        },
        "updateCompleted": (
            _state,
            { payload }: PayloadAction<{ runningServices: RunningService[] }>
        ) => {
            const { runningServices } = payload;

            return id<State>({
                "isUpdating": false,
                runningServices
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

            const { runningServices } = state;
            assert(runningServices !== undefined);

            runningServices.splice(
                runningServices.findIndex(({ id }) => id === serviceId),
                1
            );
        }
    }
});
