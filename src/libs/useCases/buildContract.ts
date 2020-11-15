
import type { AppThunk, ParamsNeededToInitializeKeycloakClient, ParamsNeededToInitializeVaultClient } from "../setup";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { VaultClient } from "../ports/VaultClient";
import type { KeycloakClient } from "../ports/KeycloakClient";
import { createSlice } from "@reduxjs/toolkit";
import { 
    createObjectThatThrowsIfAccessed,
    createPropertyThatThrowIfAccessed
} from "../utils/createObjectThatThrowsIfAccessed";
import { assert } from "evt/tools/typeSafety/assert";
import { id } from "evt/tools/typeSafety/id";

export const name = "buildContract";

type VaultConfig = Pick<ParamsNeededToInitializeVaultClient.Real, "baseUri" | "engine" | "role">;
type KeycloakConfig = ParamsNeededToInitializeKeycloakClient.Real["keycloakConfig"];

const vaultConfigByClient = new WeakMap<VaultClient, VaultConfig>();
const keycloakConfigByClient = new WeakMap<KeycloakClient, KeycloakConfig>();

/*
export declare type ContractExtrasState =
    ContractExtrasState.NotBeingRefreshed |
    ContractExtrasState.BeingRefreshed;
export declare namespace ContractExtrasState {

    export type NotBeingRefreshed = {
        areTokensBeingRefreshed: false;
        oidcTokens: {
            accessToken: string;
            idToken: string;
            refreshToken: string;
        };
        vaultToken: string;
    };

    export type BeingRefreshed = {
        areTokensBeingRefreshed: true;
    };

}
*/


export type State = {
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
    "initialState": id<State>({
        "areTokensBeingRefreshed": true,
        "oidcTokens": createObjectThatThrowsIfAccessed(),
        ...createPropertyThatThrowIfAccessed<State, "vaultToken">("vaultToken")
    }),
    "reducers": {
        /*
        "initializationCompleted":
            (...[, { payload }]: [any, PayloadAction<ContractExtrasState.NotBeingRefreshed>]) => payload,
            */
        "oidcTokensRenewed": (state, { payload }: PayloadAction<Pick<State, "oidcTokens">>)=> {
            const { oidcTokens } = payload;
            state.oidcTokens = oidcTokens;
        },
        "vaultTokenRenewed": (state, { payload }: PayloadAction<Pick<State, "vaultToken">>)=> {
            const { vaultToken } = payload;
            state.vaultToken = vaultToken;
        },
        "startedOrStoppedRefreshing": (state, { payload }: PayloadAction<Pick<State, "areTokensBeingRefreshed">>)=> {
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


            keycloakClient.evtOidcTokens.attach(oidcTokens => 
                dispatch(actions.oidcTokensRenewed({ oidcTokens }))
            );



            vaultClient.evtVaultToken
            .attach(
                vaultToken => { 

                    if( vaultToken === undefined ){
                        dispatch(actions.startedOrStoppedRefreshing({ "areTokensBeingRefreshed": true }));
                    }else{
                        dispatch(actions.vaultTokenRenewed({ vaultToken }));
                        dispatch(actions.startedOrStoppedRefreshing({"areTokensBeingRefreshed": false }));
                    }

                }
            );

        }


}

export const thunks = {

    "getParamsNeededToInitializeKeycloakAndVolt":
        () => async (...args: Parameters<AppThunk>) => {

            const [, , { vaultClient, keycloakClient }] = args;

            return {
                "vaultConfig": vaultConfigByClient.get(vaultClient)!,
                "keycloakConfig": keycloakConfigByClient.get(keycloakClient)!
            };

        },
    /** Once this thunk resolves we can assume oidc tokens and Volt token to be valid */
    "refreshAllTokens":
        (): AppThunk => async (...args) => {

            const [dispatch, , { vaultClient, keycloakClient }] = args;

            dispatch(actions.startedOrStoppedRefreshing({ "areTokensBeingRefreshed": true }));

            assert(keycloakClient.isUserLoggedIn);

            await keycloakClient.renewOidcTokensIfExpiresSoonOrRedirectToLoginIfAlreadyExpired();

            if (vaultClient.evtVaultToken.state === undefined) {
                await vaultClient.evtVaultToken.evtChange.waitFor();
            }

            dispatch(actions.startedOrStoppedRefreshing({ "areTokensBeingRefreshed": false }));

        },




};