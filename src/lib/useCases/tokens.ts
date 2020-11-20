
import type {
    AppThunk,
    ParamsNeededToInitializeKeycloakClient,
    ParamsNeededToInitializeVaultClient
} from "../setup";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { VaultClient } from "../ports/VaultClient";
import type { KeycloakClient } from "../ports/KeycloakClient";
import { createSlice } from "@reduxjs/toolkit";
import { assert } from "evt/tools/typeSafety/assert";
import { id } from "evt/tools/typeSafety/id";
import { Evt, nonNullable } from "evt";

export const name = "tokens";

export type VaultConfig = Pick<ParamsNeededToInitializeVaultClient.Real, "baseUri" | "engine" | "role">;
export type KeycloakConfig = ParamsNeededToInitializeKeycloakClient.Real["keycloakConfig"];

const vaultConfigByClient = new WeakMap<VaultClient, VaultConfig>();
const keycloakConfigByClient = new WeakMap<KeycloakClient, KeycloakConfig>();

export type TokenState = {
    areTokensBeingRefreshed: boolean;
    oidcTokens: {
        accessToken: string;
        idToken: string;
        refreshToken: string;
    };
    vaultToken: string;
};

const { reducer, actions } = createSlice({
    name,
    "initialState": id<TokenState>({} as any),
    "reducers": {
        "oidcTokensRenewed": (state, { payload }: PayloadAction<Pick<TokenState, "oidcTokens">>) => {
            const { oidcTokens } = payload;
            state.oidcTokens = oidcTokens;
        },
        "vaultTokenRenewed": (state, { payload }: PayloadAction<Pick<TokenState, "vaultToken">>) => {
            const { vaultToken } = payload;
            state.vaultToken = vaultToken;
        },
        "startedOrStoppedRefreshing": (state, { payload }: PayloadAction<Pick<TokenState, "areTokensBeingRefreshed">>) => {
            const { areTokensBeingRefreshed } = payload;
            state.areTokensBeingRefreshed = areTokensBeingRefreshed;
        }
    }
});

export { reducer };


export const privateThunks = {

    "initialize":
        (params: {
            vaultConfig: VaultConfig;
            keycloakConfig: KeycloakConfig;
        }): AppThunk<void> => async (...args) => {

            const {
                vaultConfig,
                keycloakConfig
            } = params;

            const [dispatch, , { vaultClient, keycloakClient }] = args;

            vaultConfigByClient.set(vaultClient, vaultConfig);
            keycloakConfigByClient.set(keycloakClient, keycloakConfig);

            assert(keycloakClient.isUserLoggedIn);

            keycloakClient.evtOidcTokens.$attach(
                nonNullable(),
                oidcTokens => dispatch(actions.oidcTokensRenewed({ oidcTokens }))
            );

            vaultClient.evtVaultToken.$attach(
                nonNullable(),
                vaultToken => dispatch(actions.vaultTokenRenewed({ vaultToken }))
            );

            Evt.merge([
                vaultClient.evtVaultToken,
                vaultClient.evtVaultToken
            ])
                .toStateful()
                .$attach(
                    () => [
                        vaultClient.evtVaultToken.state === undefined ||
                        vaultClient.evtVaultToken.state === undefined
                    ],
                    areTokensBeingRefreshed =>
                        dispatch(actions.startedOrStoppedRefreshing({ areTokensBeingRefreshed }))
                );


        }
}

export const thunks = {
    "getParamsNeededToInitializeKeycloakAndVolt":
        () => (...args: Parameters<AppThunk>) => {

            const [, , { vaultClient, keycloakClient }] = args;

            return {
                "vaultConfig": vaultConfigByClient.get(vaultClient)!,
                "keycloakConfig": keycloakConfigByClient.get(keycloakClient)!
            };

        },
    /** Once this thunk resolves we can assume oidc tokens and Volt token to be valid */
    "refreshTokenIfExpiresInLessThan8Hours":
        (): AppThunk => async (...args) => {

            const [, , { keycloakClient }] = args;

            assert(keycloakClient.isUserLoggedIn);

            keycloakClient.renewOidcTokensIfExpiresSoonOrRedirectToLoginIfAlreadyExpired(
                { "minValidity": 3600 * 8 }
            );

        }

};