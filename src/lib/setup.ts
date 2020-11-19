
import type { Action, ThunkAction } from "@reduxjs/toolkit";
import { configureStore, getDefaultMiddleware } from "@reduxjs/toolkit";
import { createInMemoryImplOfVaultClient } from "./secondaryAdapters/inMemoryVaultClient";
import { createRestImplOfVaultClient } from "./secondaryAdapters/restVaultClient";
import * as translateVaultRequests from "./useCases/translateVaultRequests";
import * as secretExplorerUseCase from "./useCases/secretExplorer";
import * as userProfileInVaultUseCase from "./useCases/userProfileInVault";
import * as buildContract from "./useCases/buildContract";
import type { VaultClient } from "./ports/VaultClient";
import { getVaultClientProxyWithTranslator } from "./ports/VaultClient";
import type { AsyncReturnType } from "evt/tools/typeSafety/AsyncReturnType";
import { Deferred } from "evt/tools/Deferred";
import { assert } from "evt/tools/typeSafety/assert";
import { createObjectThatThrowsIfAccessed } from "./utils/createObjectThatThrowsIfAccessed";
import { createImplOfKeycloakClientBasedOnOfficialAddapter } from "./secondaryAdapters/basedOnOfficialAdapterKeycloakClient";
import type { KeycloakClient } from "./ports/KeycloakClient";
import { parseOidcAccessToken } from "./ports/KeycloakClient";

/* ---------- Legacy ---------- */
import * as myFiles from "js/redux/myFiles";
import * as myLab from "js/redux/myLab";
import * as regions from "js/redux/regions";
import * as user from "js/redux/user";
import * as app from "js/redux/app";


export type Dependencies = {
    vaultClient: VaultClient;
    evtVaultCliTranslation: ReturnType<typeof getVaultClientProxyWithTranslator>["evtTranslation"];
    keycloakClient: KeycloakClient;
};


export type CreateStoreParams = {
    paramsNeededToInitializeVaultClient: ParamsNeededToInitializeVaultClient;
    paramsNeededToInitializeKeycloakClient: ParamsNeededToInitializeKeycloakClient;
};

export declare type ParamsNeededToInitializeVaultClient =
    ParamsNeededToInitializeVaultClient.InMemory |
    ParamsNeededToInitializeVaultClient.Real;

export declare namespace ParamsNeededToInitializeVaultClient {

    export type InMemory = {
        doUseInMemoryClient: true;
    } & Parameters<typeof createInMemoryImplOfVaultClient>[0];

    export type Real = {
        doUseInMemoryClient: false;
    } & Omit<Parameters<typeof createRestImplOfVaultClient>[0], 
        "evtOidcAccessToken" |
        "renewOidcAccessTokenIfItExpiresSoonOrRedirectToLoginIfAlreadyExpired"
    >;

}

export declare type ParamsNeededToInitializeKeycloakClient =
    ParamsNeededToInitializeKeycloakClient.InMemory |
    ParamsNeededToInitializeKeycloakClient.Real;

export declare namespace ParamsNeededToInitializeKeycloakClient {

    export type InMemory = {
        doUseInMemoryClient: true;
    };

    export type Real = {
        doUseInMemoryClient: false;
    } & Parameters<typeof createImplOfKeycloakClientBasedOnOfficialAddapter>[0];

}


const reducer = {
    // Legacy
    [myFiles.name]: myFiles.reducer,
    [myLab.name]: myLab.reducer,
    [app.name]: app.reducer,
    [user.name]: user.reducer,
    [regions.name]: regions.reducer,

    [translateVaultRequests.name]: translateVaultRequests.reducer,
    [secretExplorerUseCase.name]: secretExplorerUseCase.reducer,
    [userProfileInVaultUseCase.name]: userProfileInVaultUseCase.reducer,
    [buildContract.name]: buildContract.reducer
};

const getMiddleware = (params: { dependencies: Dependencies; }) => ({
    "middleware": getDefaultMiddleware({
        "thunk": {
            "extraArgument": params.dependencies
        },
    }),
});

async function createStoreForLoggedUser(
    params: {
        paramsNeededToInitializeVaultClient: ParamsNeededToInitializeVaultClient;
        keycloakClient: KeycloakClient.LoggedIn;
    }
) {

    //const { idep, email, paramsNeededToInitializeVaultClient } = params;
    const { keycloakClient, paramsNeededToInitializeVaultClient } = params;

    const {
        vaultClientProxy: vaultClient,
        evtTranslation: evtVaultCliTranslation,
    } = getVaultClientProxyWithTranslator({
        "translateForClientType": "CLI",
        "vaultClient":
            paramsNeededToInitializeVaultClient.doUseInMemoryClient ?
                createInMemoryImplOfVaultClient(paramsNeededToInitializeVaultClient) :
                createRestImplOfVaultClient({
                    ...paramsNeededToInitializeVaultClient,
                    "evtOidcAccessToken": keycloakClient.evtOidcTokens
                        .pipe(oidcTokens => [oidcTokens?.accessToken]),
                    "renewOidcAccessTokenIfItExpiresSoonOrRedirectToLoginIfAlreadyExpired":
                        keycloakClient.renewOidcTokensIfExpiresSoonOrRedirectToLoginIfAlreadyExpired
                }),
    });

    const store = configureStore({
        reducer,
        ...getMiddleware({
            "dependencies": {
                vaultClient,
                evtVaultCliTranslation,
                keycloakClient
            }
        })
    });

    store.dispatch(
        secretExplorerUseCase.thunks.navigateToPath(
            { "path": (await parseOidcAccessToken(keycloakClient)).idep }
        )
    );

    await store.dispatch(
        userProfileInVaultUseCase.privateThunks.initialize()
    );

    return { store };

}


async function createStoreForNonLoggedUser(
    params: { keycloakClient: KeycloakClient.NotLoggedIn; }
): Promise<AsyncReturnType<typeof createStoreForLoggedUser>> {

    const { keycloakClient } = params;
    const store = configureStore({
        reducer,
        ...getMiddleware({
            "dependencies": {
                "vaultClient":
                    createObjectThatThrowsIfAccessed<Dependencies["vaultClient"]>(),
                "evtVaultCliTranslation":
                    createObjectThatThrowsIfAccessed<Dependencies["evtVaultCliTranslation"]>(),
                keycloakClient
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

    const {
        paramsNeededToInitializeKeycloakClient,
        paramsNeededToInitializeVaultClient
    } = params;

    assert(
        !paramsNeededToInitializeKeycloakClient.doUseInMemoryClient,
        "TODO: We need a mock implementation of KeycloakClient"
    );


    const keycloakClient =
        await createImplOfKeycloakClientBasedOnOfficialAddapter(
            paramsNeededToInitializeKeycloakClient
        );


    const { store } = await (
        keycloakClient.isUserLoggedIn ?
            createStoreForLoggedUser({ keycloakClient, paramsNeededToInitializeVaultClient }) :
            createStoreForNonLoggedUser({ keycloakClient })
    );

    //TODO: Finish refactoring
    store.dispatch(
        app.actions.setIsAuthenticated(
            { "isUserLoggedIn": keycloakClient.isUserLoggedIn }
        )
    );

    if (keycloakClient.isUserLoggedIn) {

        store.dispatch(
            buildContract.privateThunks.initialize(
                {
                    "vaultConfig": paramsNeededToInitializeVaultClient.doUseInMemoryClient ?
                        {
                            "baseUri": "",
                            "engine": paramsNeededToInitializeVaultClient.engine,
                            "role": ""
                        } : paramsNeededToInitializeVaultClient,
                    "keycloakConfig": paramsNeededToInitializeKeycloakClient.keycloakConfig
                }
            )
        );

    }

    dKeyCloakClient.resolve(keycloakClient);

    dStoreInstance.resolve(store);

    //TODO: Move the rest of the redux slices inside.
    if (keycloakClient.isUserLoggedIn) {

        await store.dispatch(user.privateThunks.initialize());

    }

    return store;

}





export const thunks = {
    [userProfileInVaultUseCase.name]: userProfileInVaultUseCase.thunks,
    [secretExplorerUseCase.name]: secretExplorerUseCase.thunks,
    [translateVaultRequests.name]: translateVaultRequests.thunks,
    [buildContract.name]: buildContract.thunks,
    [user.name]: user.thunk,
    [app.name]: app.thunk
};

export type Store = AsyncReturnType<typeof createStore>;

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

const dKeyCloakClient = new Deferred<KeycloakClient>();

/** @deprecated */
export const { pr: prKeycloakClient } = dKeyCloakClient;


