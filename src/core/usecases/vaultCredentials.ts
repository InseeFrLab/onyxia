import "minimal-polyfills/Object.fromEntries";
import type { ThunkAction } from "../setup";
import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import { id } from "tsafe/id";
import type { State } from "../setup";
import { createSelector } from "@reduxjs/toolkit";
import { selectors as deploymentRegionSelectors } from "./deploymentRegion";
import { assert } from "tsafe/assert";

type VaultCredentialState =
    | VaultCredentialState.NotRefreshed
    | VaultCredentialState.Ready;

namespace VaultCredentialState {
    type Common = {
        isRefreshing: boolean;
    };

    export type NotRefreshed = Common & {
        stateDescription: "not refreshed";
    };

    export type Ready = Common & {
        stateDescription: "ready";
        expirationTime: number;
        token: string;
    };
}

export const name = "vaultCredentials";

export const { reducer, actions } = createSlice({
    name,
    "initialState": id<VaultCredentialState>(
        id<VaultCredentialState.NotRefreshed>({
            "stateDescription": "not refreshed",
            "isRefreshing": false
        })
    ),
    "reducers": {
        "refreshStarted": state => {
            state.isRefreshing = true;
        },
        "refreshed": (
            _state,
            {
                payload
            }: PayloadAction<{
                expirationTime: number;
                token: string;
            }>
        ) => {
            const { expirationTime, token } = payload;

            return id<VaultCredentialState.Ready>({
                "isRefreshing": false,
                "stateDescription": "ready",
                expirationTime,
                token
            });
        }
    }
});

export const thunks = {
    /** Can, and must be called before the slice is refreshed,
     * tels if the feature is available.
     */
    "isAvailable":
        (): ThunkAction<boolean> =>
        (...args) => {
            const [, getState] = args;

            const deploymentRegion = deploymentRegionSelectors.selectedDeploymentRegion(
                getState()
            );

            return deploymentRegion.vault !== undefined;
        },
    /** Refresh is expected to be called whenever the component that use this slice mounts */
    "refresh":
        (params: { doForceRenewToken: boolean }): ThunkAction =>
        async (...args) => {
            const { doForceRenewToken } = params;

            const [dispatch, getState, { secretsManagerClient }] = args;

            if (getState().s3Credentials.isRefreshing) {
                return;
            }

            dispatch(actions.refreshStarted());

            const { token, expirationTime } = await secretsManagerClient.getToken({
                "doForceRefresh": doForceRenewToken
            });

            dispatch(
                actions.refreshed({
                    token,
                    expirationTime
                })
            );
        }
};

export const selectors = (() => {
    const readyState = (rootState: State): VaultCredentialState.Ready | undefined => {
        const state = rootState.vaultCredentials;
        switch (state.stateDescription) {
            case "ready":
                return state;
            default:
                return undefined;
        }
    };

    const isReady = createSelector(readyState, readyState => readyState !== undefined);

    const vaultUrl = createSelector(
        deploymentRegionSelectors.selectedDeploymentRegion,
        region => {
            const { vault } = region;
            assert(
                vault !== undefined,
                "The ui dev should have tested .isAvailable() to display the tab or not"
            );
            return vault.url;
        }
    );

    const vaultToken = createSelector(readyState, readyState => {
        if (readyState === undefined) {
            return undefined;
        }

        return readyState.token;
    });

    const expirationTime = createSelector(readyState, readyState => {
        if (readyState === undefined) {
            return undefined;
        }

        return readyState.expirationTime;
    });

    const bashScript = createSelector(
        isReady,
        vaultToken,
        vaultUrl,
        (isReady, vaultToken, vaultUrl) => {
            if (!isReady) {
                return undefined;
            }
            assert(vaultToken !== undefined);

            return [
                `export VAULT_ADDR=${vaultUrl}`,
                `export VAULT_TOKEN=${vaultToken}`
            ].join("\n");
        }
    );

    const isRefreshing = (rootState: State) => {
        const state = rootState.vaultCredentials;
        return state.isRefreshing;
    };

    const uiState = createSelector(
        isReady,
        vaultToken,
        vaultUrl,
        expirationTime,
        isRefreshing,
        bashScript,
        (isReady, vaultToken, vaultUrl, expirationTime, isRefreshing, bashScript) => {
            if (!isReady) {
                return undefined;
            }
            assert(vaultToken !== undefined);
            assert(expirationTime !== undefined);
            assert(bashScript !== undefined);

            return {
                vaultToken,
                vaultUrl,
                expirationTime,
                isRefreshing,
                bashScript
            };
        }
    );

    return { uiState };
})();
