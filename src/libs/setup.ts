
import type { Action, ThunkAction } from "@reduxjs/toolkit";
import { configureStore, getDefaultMiddleware } from "@reduxjs/toolkit";
import { createInMemoryImplOfVaultClient } from "./secondaryAdapters/inMemoryVaultClient";
import { createRestImplOfVaultClient } from "./secondaryAdapters/restVaultClient";
import * as translateVaultRequests from "./useCases/translateVaultRequests";
import * as secretExplorerUseCase from "./useCases/secretExplorer";
import * as userProfileInVaultUseCase from "./useCases/userProfileInVault";
import type { VaultClient } from "./ports/VaultClient";
import { getVaultClientProxyWithTranslator } from "./ports/VaultClient";
import type { AsyncReturnType } from "evt/tools/typeSafety/AsyncReturnType";
import { Deferred } from "evt/tools/Deferred";
import { assert } from "evt/tools/typeSafety/assert";
import { createObjectThatThrowsIfAccessed } from "./utils/createObjectThatThrowsIfAccessed";

/* ---------- Legacy ---------- */
import * as myFiles from "js/redux/myFiles";
import * as myLab from "js/redux/myLab";
import * as regions from "js/redux/regions";
import * as user from "js/redux/user";
import * as app from "js/redux/app";




export type Dependencies = {
    vaultClient: VaultClient;
    evtVaultCliTranslation: ReturnType<typeof getVaultClientProxyWithTranslator>["evtTranslation"];
    username: string;
};

export declare type CreateStoreParams = CreateStoreParams.UserNotLoggedIn | CreateStoreParams.UserLoggedIn;

export declare namespace CreateStoreParams {

    export type UserNotLoggedIn = {
        isUserLoggedIn: false;
    };

    export type UserLoggedIn = {
        isUserLoggedIn: true;
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
    };

}

const reducer = {
    // Legacy
    [myFiles.name]: myFiles.reducer,
    [myLab.name]: myLab.reducer,
    [app.name]: app.reducer,
    [user.name]: user.reducer,
    [regions.name]: regions.reducer,

    [translateVaultRequests.sliceName]: translateVaultRequests.reducer,
    [secretExplorerUseCase.sliceName]: secretExplorerUseCase.reducer,
    [userProfileInVaultUseCase.sliceName]: userProfileInVaultUseCase.reducer
};

const getMiddleware = (params: { dependencies: Dependencies; }) => ({
    "middleware": getDefaultMiddleware({
        "thunk": {
            "extraArgument": params.dependencies
        },
    }),
});

async function createStoreForLoggedUser(params: CreateStoreParams.UserLoggedIn) {

    const { username, email, paramsNeededToInitializeVaultClient } = params;

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
        reducer,
        ...getMiddleware({
            "dependencies": {
                vaultClient,
                evtVaultCliTranslation,
                username
            }
        })
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
        userProfileInVaultUseCase.privateThunks.initializeProfile({ email })
    );

    return { store };

}


async function createStoreForNonLoggedUser(
    _params: CreateStoreParams.UserNotLoggedIn
): Promise<AsyncReturnType<typeof createStoreForLoggedUser>> {

    const store = configureStore({
        reducer,
        ...getMiddleware({
            "dependencies": {
                "vaultClient": createObjectThatThrowsIfAccessed<Dependencies["vaultClient"]>(),
                "evtVaultCliTranslation": createObjectThatThrowsIfAccessed<Dependencies["evtVaultCliTranslation"]>(),
                "username": ""
            }
        })
    });

    return { store };


}

createStore.isFirstInvocation = true;

export async function createStore(params: CreateStoreParams) {

    assert(
        createStore.isFirstInvocation,
        "createStore has already been called, " +
        "only one instance of the store is supposed to" +
        "be created"
    );

    createStore.isFirstInvocation = false;

    const { store } = await (
        params.isUserLoggedIn ?
            createStoreForLoggedUser(params) :
            createStoreForNonLoggedUser(params)
    );

    dStoreInstance.resolve(store);

    return { store };

}


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


