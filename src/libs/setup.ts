
import type { Action, ThunkAction } from "@reduxjs/toolkit";
import { configureStore, getDefaultMiddleware } from "@reduxjs/toolkit";
import { createRestImplOfVaultClient } from "./secondaryAdapters/inMemoryVaultClient";
import { createInMemoryImplOfVaultClient } from "./secondaryAdapters/restVaultClient";
import * as translateVaultRequests from "./useCases/translateVaultRequests";
import * as secretExplorerUseCase from "./useCases/secretExplorer";
import * as viewAndEditUserProfileUseCase from "./useCases/viewAndEditUserProfile";
import type { VaultClient } from "./ports/VaultClient";
import { getVaultClientProxyWithTranslator } from "./ports/VaultClient";
import { id } from "evt/tools/typeSafety/id";
import { AsyncReturnType } from "evt/tools/typeSafety/AsyncReturnType";

export type Dependencies = {
    vaultClient: VaultClient;
    evtVaultCliTranslation: ReturnType<typeof getVaultClientProxyWithTranslator>["evtTranslation"];
};

export async function getStore(
    params: {
        vault: {
            username: string;
            email: string;
            defaultPath: string;
        } & ({
            useInMemoryClient: false;
        } & Parameters<typeof createRestImplOfVaultClient>[0] | {
            useInMemoryClient: true;
            baseUri: string;
            role: string;
            oidcAccessToken: string;
        } & Parameters<typeof createInMemoryImplOfVaultClient>[0])
    }
) {

    const { vault } = params;

    const {
        vaultClientProxy: vaultClient,
        evtTranslation: evtVaultCliTranslation,
    } = getVaultClientProxyWithTranslator({
        "translateForClientType": "CLI",
        "vaultClient":
            vault.useInMemoryClient ?
                createInMemoryImplOfVaultClient(vault) :
                createRestImplOfVaultClient(vault),
    });


    const store = configureStore({
        "reducer": {
            [translateVaultRequests.sliceName]: translateVaultRequests.reducer,
            [secretExplorerUseCase.sliceName]: secretExplorerUseCase.reducer,
            [viewAndEditUserProfileUseCase.sliceName]: viewAndEditUserProfileUseCase.reducer
        },
        "middleware": getDefaultMiddleware({
            "thunk": {
                "extraArgument": id<Dependencies>({
                    vaultClient,
                    evtVaultCliTranslation
                })
            },
        }),
    });


    store.dispatch(
        translateVaultRequests.thunks.selectTranslator(
            { "clientType": "CLI" }
        )
    );

    store.dispatch(
        secretExplorerUseCase.thunks.navigateToPath(
            { "path": vault.defaultPath }
        )
    );

    await store.dispatch(
        viewAndEditUserProfileUseCase.privateThunks.initializeProfile(
            {
                "username": vault.username,
                "email": vault.email
            }
        )
    );

    return { store };

}


export type RootState = ReturnType<AsyncReturnType<typeof getStore>["store"]["getState"]>;


export type AppThunk<ReturnType = Promise<void>> = ThunkAction<
    ReturnType,
    RootState,
    Dependencies,
    Action<string>
>;

