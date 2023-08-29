import "minimal-polyfills/Object.fromEntries";
import type { Thunks } from "../core";
import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import { id } from "tsafe/id";
import type { State as RootState } from "../core";
import { createSelector } from "@reduxjs/toolkit";
import * as projectConfigs from "./projectConfigs";
import * as deploymentRegion from "./deploymentRegion";
import { parseUrl } from "core/tools/parseUrl";
import { assert } from "tsafe/assert";
import * as userAuthentication from "./userAuthentication";
import { createOidcOrFallback } from "core/adapters/oidc/createOidcOrFallback";
import { createUsecaseContextApi } from "redux-clean-architecture";
import type { Oidc } from "core/ports/Oidc";

type State = State.NotRefreshed | State.Ready;

namespace State {
    type Common = {
        isRefreshing: boolean;
    };

    export type NotRefreshed = Common & {
        stateDescription: "not refreshed";
    };

    export type Ready = Common & {
        stateDescription: "ready";
        expirationTime: number;
        oidcAccessToken: string;
        username: string;
    };
}

export const name = "k8sCredentials";

export const { reducer, actions } = createSlice({
    name,
    "initialState": id<State>(
        id<State.NotRefreshed>({
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
                oidcAccessToken: string;
                username: string;
            }>
        ) => {
            const { expirationTime, oidcAccessToken, username } = payload;

            return id<State.Ready>({
                "isRefreshing": false,
                "stateDescription": "ready",
                expirationTime,
                oidcAccessToken,
                username
            });
        }
    }
});

export const thunks = {
    /** Can, and must be called before the slice is refreshed,
     * tels if the feature is available.
     */
    "getIsAvailable":
        () =>
        (...args): boolean => {
            const [, getState] = args;

            const region = deploymentRegion.selectors.selectedDeploymentRegion(
                getState()
            );

            return region.kubernetes !== undefined;
        },
    /** Refresh is expected to be called whenever the component that use this slice mounts */
    "refresh":
        (params: { doForceRenewToken: boolean }) =>
        async (...args) => {
            const { doForceRenewToken } = params;

            const [dispatch, getState, extraArg] = args;

            const { oidc, createStoreParams } = extraArg;

            if (getState().s3Credentials.isRefreshing) {
                return;
            }

            dispatch(actions.refreshStarted());

            const { kubernetes } = deploymentRegion.selectors.selectedDeploymentRegion(
                getState()
            );

            assert(kubernetes !== undefined);

            assert(oidc.isUserLoggedIn);

            const context = getContext(extraArg);

            let { kubernetesOidcClient } = context;

            if (kubernetesOidcClient === undefined) {
                kubernetesOidcClient = await createOidcOrFallback({
                    "fallback": {
                        oidc,
                        "keycloakParams": (() => {
                            const { keycloakParams } = createStoreParams;

                            assert(keycloakParams !== undefined);

                            return keycloakParams;
                        })()
                    },
                    "keycloakParams": kubernetes.keycloakParams
                });

                context.kubernetesOidcClient = kubernetesOidcClient;
            }

            if (doForceRenewToken) {
                await kubernetesOidcClient.renewToken();
            }

            const { accessToken, expirationTime } = kubernetesOidcClient.getAccessToken();

            dispatch(
                actions.refreshed({
                    "username": dispatch(userAuthentication.thunks.getUser()).username,
                    "oidcAccessToken": accessToken,
                    expirationTime
                })
            );
        }
} satisfies Thunks;

const { getContext } = createUsecaseContextApi<{
    kubernetesOidcClient: Oidc.LoggedIn | undefined;
}>(() => ({
    "kubernetesOidcClient": undefined
}));

export const selectors = (() => {
    const readyState = (rootState: RootState): State.Ready | undefined => {
        const state = rootState.k8sCredentials;
        switch (state.stateDescription) {
            case "ready":
                return state;
            default:
                return undefined;
        }
    };

    const isReady = createSelector(readyState, readyState => readyState !== undefined);

    const kubernetesClusterUrl = createSelector(
        deploymentRegion.selectors.selectedDeploymentRegion,
        (selectedDeploymentRegion): string => {
            const { kubernetes } = selectedDeploymentRegion;

            assert(kubernetes !== undefined, "isAvailable should have been called");

            return kubernetes.url;
        }
    );

    const kubernetesNamespace = createSelector(
        projectConfigs.selectors.selectedProject,
        selectedProject => selectedProject.namespace
    );

    const oidcAccessToken = createSelector(
        readyState,
        (readyState): undefined | string => {
            if (readyState === undefined) {
                return undefined;
            }

            return readyState.oidcAccessToken;
        }
    );

    const expirationTime = createSelector(readyState, readyState => {
        if (readyState === undefined) {
            return undefined;
        }

        return readyState.expirationTime;
    });

    const username = createSelector(readyState, readyState => {
        if (readyState === undefined) {
            return undefined;
        }

        return readyState.username;
    });

    const bashScript = createSelector(
        isReady,
        kubernetesNamespace,
        kubernetesClusterUrl,
        oidcAccessToken,
        username,
        (
            isReady,
            kubernetesNamespace,
            kubernetesClusterUrl,
            oidcAccessToken,
            username
        ) => {
            if (!isReady) {
                return undefined;
            }
            assert(oidcAccessToken !== undefined);
            assert(username !== undefined);

            const { host } = parseUrl(kubernetesClusterUrl);

            return [
                `kubectl config set-cluster ${host} --server=${kubernetesClusterUrl} --insecure-skip-tls-verify=true`,
                `kubectl config set-credentials oidc-${username} --token ${oidcAccessToken}`,
                `kubectl config set-context ${host} --user=oidc-${username} --cluster=${host} --namespace=${kubernetesNamespace}`,
                `kubectl config use-context ${host}`
            ].join("\n");
        }
    );

    const isRefreshing = createSelector(readyState, readyState =>
        readyState === undefined ? false : readyState.isRefreshing
    );

    const uiState = createSelector(
        isReady,
        kubernetesNamespace,
        kubernetesClusterUrl,
        oidcAccessToken,
        bashScript,
        expirationTime,
        isRefreshing,
        (
            isReady,
            kubernetesNamespace,
            kubernetesClusterUrl,
            oidcAccessToken,
            bashScript,
            expirationTime,
            isRefreshing
        ) => {
            if (!isReady) {
                return undefined;
            }
            assert(oidcAccessToken !== undefined);
            assert(bashScript !== undefined);
            assert(expirationTime !== undefined);

            return {
                isRefreshing,
                kubernetesNamespace,
                kubernetesClusterUrl,
                oidcAccessToken,
                expirationTime,
                bashScript
            };
        }
    );

    return {
        isReady,
        kubernetesClusterUrl,
        oidcAccessToken,
        kubernetesNamespace,
        expirationTime,
        bashScript,
        uiState
    };
})();
