
import type { AppThunk } from "../setup";
import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import { assert } from "evt/tools/typeSafety/assert";
import { id } from "evt/tools/typeSafety/id";
import { Evt, nonNullable } from "evt";

export const name = "tokens";

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
        (): AppThunk<void> => async (...args) => {

            const [dispatch, , { vaultClient, keycloakClient }] = args;

            assert(keycloakClient.isUserLoggedIn);

            keycloakClient.evtOidcTokens.$attach(
                oidcTokens => oidcTokens === undefined ? null: [oidcTokens],
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