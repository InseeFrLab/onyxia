
import type { AppThunk, ParamsNeededToInitializeKeycloakClient, ParamsNeededToInitializeVaultClient } from "../setup";
import { parseOidcAccessToken } from "../ports/KeycloakClient";
import type { VaultClient } from "../ports/VaultClient";
import type { KeycloakClient } from "../ports/KeycloakClient";

export const name = "buildContract";

const paramsOfVault= new WeakMap<VaultClient, ParamsNeededToInitializeVaultClient>();
const paramsOfKeycloak = new WeakMap<KeycloakClient, ParamsNeededToInitializeKeycloakClient>();


export const privateThunks = {

    "initialize":
        (params: {
            paramsNeededToInitializeKeycloakClient: ParamsNeededToInitializeKeycloakClient.Real;
            paramsNeededToInitializeVaultClient: ParamsNeededToInitializeVaultClient.Real
        }): AppThunk<void> => async (...args) => {

            const {
                paramsNeededToInitializeVaultClient,
                paramsNeededToInitializeKeycloakClient
            }=params;

            const [, , { vaultClient, keycloakClient }] = args;

            paramsOfVault.set(vaultClient, paramsNeededToInitializeVaultClient);
            paramsOfKeycloak.set(keycloakClient, paramsNeededToInitializeKeycloakClient)

        }


}

export const thunks = {

    "getRelevantValuesForBuildContract":
        (): AppThunk<{}> => async (...args) => {

            const [, getState, { vaultClient, keycloakClient }] = args;

            paramsOfVault.set(vaultClient, paramsNeededToInitializeVaultClient);
            paramsOfKeycloak.set(keycloakClient, paramsNeededToInitializeKeycloakClient)

        }




};