import "minimal-polyfills/Object.fromEntries";
import { createUsecaseActions, createSelector } from "clean-architecture";
import { id } from "tsafe/id";
import type { State as RootState, Thunks } from "core/bootstrap";
import * as deploymentRegionManagement from "core/usecases/deploymentRegionManagement";
import { assert } from "tsafe/assert";

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
        token: string;
    };
}

export const name = "vaultCredentials";

export const { reducer, actions } = createUsecaseActions({
    name,
    initialState: id<State>(
        id<State.NotRefreshed>({
            stateDescription: "not refreshed",
            isRefreshing: false
        })
    ),
    reducers: {
        refreshStarted: state => {
            state.isRefreshing = true;
        },
        refreshed: (
            _state,
            {
                payload
            }: {
                payload: {
                    expirationTime: number;
                    token: string;
                };
            }
        ) => {
            const { expirationTime, token } = payload;

            return id<State.Ready>({
                isRefreshing: false,
                stateDescription: "ready",
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
    isAvailable:
        () =>
        (...args): boolean => {
            const [, getState] = args;

            const region =
                deploymentRegionManagement.selectors.currentDeploymentRegion(getState());

            return region.vault !== undefined;
        },
    /** Refresh is expected to be called whenever the component that use this slice mounts */
    refresh:
        (params: { doForceRenewToken: boolean }) =>
        async (...args) => {
            const { doForceRenewToken } = params;

            const [dispatch, getState, { secretsManager }] = args;

            if (getState()[name].isRefreshing) {
                return;
            }

            dispatch(actions.refreshStarted());

            const { token, expirationTime } = await secretsManager.getToken({
                doForceRefresh: doForceRenewToken
            });

            dispatch(
                actions.refreshed({
                    token,
                    expirationTime
                })
            );
        }
} satisfies Thunks;

export const selectors = (() => {
    const readyState = (rootState: RootState): State.Ready | undefined => {
        const state = rootState[name];
        switch (state.stateDescription) {
            case "ready":
                return state;
            default:
                return undefined;
        }
    };

    const isReady = createSelector(readyState, readyState => readyState !== undefined);

    const vaultUrl = createSelector(
        deploymentRegionManagement.selectors.currentDeploymentRegion,
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

    const isRefreshing = (rootState: RootState) => {
        const state = rootState[name];
        return state.isRefreshing;
    };

    const main = createSelector(
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

    return { main };
})();
