
import type { Action, ThunkAction } from "@reduxjs/toolkit";
import { configureStore, getDefaultMiddleware } from "@reduxjs/toolkit";
import { createInMemoryImplOfVaultClient } from "./secondaryAdapters/inMemoryVaultClient";
import { createRestImplOfVaultClient } from "./secondaryAdapters/restVaultClient";
import * as translateVaultRequests from "./useCases/translateVaultRequests";
import * as secretExplorerUseCase from "./useCases/secretExplorer";
import * as userProfileInVaultUseCase from "./useCases/userProfileInVault";
import type { VaultClient } from "./ports/VaultClient";
import { getVaultClientProxyWithTranslator } from "./ports/VaultClient";
import { id } from "evt/tools/typeSafety/id";
import { AsyncReturnType } from "evt/tools/typeSafety/AsyncReturnType";
import { Deferred } from "evt/tools/Deferred";
import { assert } from "evt/tools/typeSafety/assert";

/* ---------- Legacy ---------- */
import * as myFiles from "js/redux/myFiles";
import * as myLab from "js/redux/myLab";
import * as regions from "js/redux/regions";
import * as user from "js/redux/user";
import * as app from "js/redux/app";




export type Dependencies = {
    vaultClient: VaultClient;
    evtVaultCliTranslation: ReturnType<typeof getVaultClientProxyWithTranslator>["evtTranslation"];
};


export async function createStore(
    params: {
        username: string;
        email: string;
        paramsNeededToInitializeVaultClient:
        {
            useInMemoryClient: false;
        } & Parameters<typeof createRestImplOfVaultClient>[0]
        |
        {
            useInMemoryClient: true;
        } & Parameters<typeof createInMemoryImplOfVaultClient>[0]
    }
) {

    assert(
        createStore.isFirstInvocation,
        "createStore has already been called, " +
        "only one instance of the store is supposed to" +
        "be created"
    );

    createStore.isFirstInvocation = false;

    const {
        username,
        email,
        paramsNeededToInitializeVaultClient
    } = params;

    const {
        vaultClientProxy: vaultClient,
        evtTranslation: evtVaultCliTranslation,
    } = getVaultClientProxyWithTranslator({
        "translateForClientType": "CLI",
        "vaultClient":
            paramsNeededToInitializeVaultClient.useInMemoryClient ?
                createInMemoryImplOfVaultClient(paramsNeededToInitializeVaultClient) :
                createRestImplOfVaultClient(paramsNeededToInitializeVaultClient),
    });


    const store = configureStore({
        "reducer": {
            [translateVaultRequests.sliceName]: translateVaultRequests.reducer,
            [secretExplorerUseCase.sliceName]: secretExplorerUseCase.reducer,
            [userProfileInVaultUseCase.sliceName]: userProfileInVaultUseCase.reducer,

            // Legacy
            [myFiles.name]: myFiles.reducer,
            [myLab.name]: myLab.reducer,
            [app.name]: app.reducer,
            [user.name]: user.reducer,
            [regions.name]: regions.reducer,
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
            { "path": username }
        )
    );

    await store.dispatch(
        userProfileInVaultUseCase.privateThunks.initializeProfile(
            {
                "username": username,
                email
            }
        )
    );

    dStoreInstance.resolve(store);

    return { store };

}

createStore.isFirstInvocation = true;

export const thunks = {
    [userProfileInVaultUseCase.sliceName]: userProfileInVaultUseCase.thunks,
    [secretExplorerUseCase.sliceName]: secretExplorerUseCase.thunks,
    [translateVaultRequests.sliceName]: translateVaultRequests.thunks
};

export type Store = AsyncReturnType<typeof createStore>["store"];

export type RootState = ReturnType<Store["getState"]>;

export type AppThunk<ReturnType = Promise<void>> = ThunkAction<
    ReturnType,
    RootState,
    Dependencies,
    Action<string>
>;




const dStoreInstance = new Deferred<Store>();

/** 
 * A promise that resolve to the store instance.
 * If createStore isn't called it's pending forever.
 * 
 * @deprecated: use "js/react/hooks" to interact with the store.
 */
export const { pr: prStore } = dStoreInstance;


