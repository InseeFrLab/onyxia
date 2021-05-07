
import type { AppThunk } from "../setup";
import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import { assert } from "tsafe/assert";
import { id } from "tsafe/id";
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

            const [dispatch, , { evtVaultToken, oidcClient }] = args;

            assert(oidcClient.isUserLoggedIn);

            oidcClient.evtOidcTokens.$attach(
                nonNullable(),
                oidcTokens => dispatch(actions.oidcTokensRenewed({ oidcTokens }))
            );

            evtVaultToken.$attach(
                nonNullable(),
                vaultToken => dispatch(actions.vaultTokenRenewed({ vaultToken }))
            );

            Evt.merge([
                evtVaultToken,
                evtVaultToken
            ])
                .toStateful()
                .$attach(
                    () => [
                        evtVaultToken.state === undefined ||
                        evtVaultToken.state === undefined
                    ],
                    areTokensBeingRefreshed =>
                        dispatch(actions.startedOrStoppedRefreshing({ areTokensBeingRefreshed }))
                );


        }
}
