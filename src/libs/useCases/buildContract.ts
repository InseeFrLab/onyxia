
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
import { Evt } from "evt";

export const name = "buildContract";

type VaultConfig = Pick<ParamsNeededToInitializeVaultClient.Real, "baseUri" | "engine" | "role">;
type KeycloakConfig = ParamsNeededToInitializeKeycloakClient.Real["keycloakConfig"];

const vaultConfigByClient = new WeakMap<VaultClient, VaultConfig>();
const keycloakConfigByClient = new WeakMap<KeycloakClient, KeycloakConfig>();

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
    "initialState": id<State>({} as any),
    "reducers": {
        "oidcTokensRenewed": (state, { payload }: PayloadAction<Pick<State, "oidcTokens">>) => {
            const { oidcTokens } = payload;
            state.oidcTokens = oidcTokens;
        },
        "vaultTokenRenewed": (state, { payload }: PayloadAction<Pick<State, "vaultToken">>) => {
            const { vaultToken } = payload;
            state.vaultToken = vaultToken;
        },
        "startedOrStoppedRefreshing": (state, { payload }: PayloadAction<Pick<State, "areTokensBeingRefreshed">>) => {
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

            const evtOidcTokens = keycloakClient.evtOidcTokens.pipe();
            const evtVaultToken = vaultClient.evtVaultToken.pipe();

            evtOidcTokens.$attach(
                oidcTokens => !oidcTokens ? null : [oidcTokens],
                oidcTokens => dispatch(actions.oidcTokensRenewed({ oidcTokens }))
            );

            evtVaultToken.$attach(
                vaultToken => !vaultToken ? null : [vaultToken],
                vaultToken => dispatch(actions.vaultTokenRenewed({ vaultToken }))
            );

            Evt.merge([
                evtVaultToken,
                evtOidcTokens
            ])
                .toStateful()
                .pipe(() => [
                    evtVaultToken === undefined ||
                    evtOidcTokens === undefined
                ])
                .attach(
                    areTokensBeingRefreshed =>
                        dispatch(actions.startedOrStoppedRefreshing({ areTokensBeingRefreshed }))
                );


            //TODO: Make so that attach on stateful evt invokes with state
            evtOidcTokens.post(evtOidcTokens.state);
            evtVaultToken.post(evtVaultToken.state);


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
    "refreshTokenIfNeeded":
        (): AppThunk => async (...args) => {

            const [, , { keycloakClient }] = args;

            assert(keycloakClient.isUserLoggedIn);

            keycloakClient.renewOidcTokensIfExpiresSoonOrRedirectToLoginIfAlreadyExpired();

        }

};