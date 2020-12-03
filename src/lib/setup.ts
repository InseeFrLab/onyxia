
import type { Action, ThunkAction } from "@reduxjs/toolkit";
import { configureStore, getDefaultMiddleware } from "@reduxjs/toolkit";
import { createInMemoryImplOfVaultClient } from "./secondaryAdapters/inMemoryVaultClient";
import { createRestImplOfVaultClient } from "./secondaryAdapters/restVaultClient";
import * as secretExplorerUseCase from "./useCases/secretExplorer";
import * as userProfileInVaultUseCase from "./useCases/userProfileInVault";
import * as tokenUseCase from "./useCases/tokens";
import * as appConstantsUseCase from "./useCases/appConstants";
import type { VaultClient } from "./ports/VaultClient";
import { getVaultClientProxyWithTranslator } from "./ports/VaultClient";
import type { AsyncReturnType } from "evt/tools/typeSafety/AsyncReturnType";
import { Deferred } from "evt/tools/Deferred";
import { assert } from "evt/tools/typeSafety/assert";
import { createObjectThatThrowsIfAccessed } from "./utils/createObjectThatThrowsIfAccessed";
import { createImplOfKeycloakClientBasedOnOfficialAddapter } from "./secondaryAdapters/basedOnOfficialAdapterKeycloakClient";
import type { KeycloakClient } from "./ports/KeycloakClient";
import { parseOidcAccessToken } from "./ports/KeycloakClient";
import { id } from "evt/tools/typeSafety/id";
import type { NonPostableEvt } from "evt";

/* ---------- Legacy ---------- */
import * as myFiles from "js/redux/myFiles";
import * as myLab from "js/redux/myLab";
import * as regions from "js/redux/regions";
import * as user from "js/redux/user";
import * as app from "js/redux/app";


export type Dependencies = {
    vaultClient: VaultClient;
    keycloakClient: KeycloakClient;
};


export type CreateStoreParams = {
    isPrefersColorSchemeDark: boolean;
    paramsNeededToInitializeVaultClient: ParamsNeededToInitializeVaultClient;
    keycloakConfig: KeycloakConfig;
    evtBackOnline: NonPostableEvt<void>;
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

export declare type KeycloakConfig =
    KeycloakConfig.InMemory |
    KeycloakConfig.Real;

export declare namespace KeycloakConfig {

    export type InMemory = {
        doUseInMemoryClient: true;
    };

    export type Real = {
        doUseInMemoryClient: false;
    } & Parameters<typeof createImplOfKeycloakClientBasedOnOfficialAddapter>[0]["keycloakConfig"];

}


const reducer = {
    // Legacy
    [myFiles.name]: myFiles.reducer,
    [myLab.name]: myLab.reducer,
    [app.name]: app.reducer,
    [user.name]: user.reducer,
    [regions.name]: regions.reducer,

    [secretExplorerUseCase.name]: secretExplorerUseCase.reducer,
    [userProfileInVaultUseCase.name]: userProfileInVaultUseCase.reducer,
    [tokenUseCase.name]: tokenUseCase.reducer
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
    } & Pick<CreateStoreParams, "isPrefersColorSchemeDark">
) {

    //const { idep, email, paramsNeededToInitializeVaultClient } = params;
    const {
        keycloakClient,
        paramsNeededToInitializeVaultClient,
        isPrefersColorSchemeDark
    } = params;

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
                keycloakClient
            }
        })
    });

    store.dispatch(tokenUseCase.privateThunks.initialize());

    store.dispatch(
        secretExplorerUseCase.thunks.navigateToPath(
            { "path": (await parseOidcAccessToken(keycloakClient)).idep }
        )
    );

    await store.dispatch(
        userProfileInVaultUseCase.privateThunks.initialize({ isPrefersColorSchemeDark })
    );

    return { store, evtVaultCliTranslation };

}


async function createStoreForNonLoggedUser(
    params: { keycloakClient: KeycloakClient.NotLoggedIn; }
) {

    const { keycloakClient } = params;
    const store: AsyncReturnType<typeof createStoreForLoggedUser>["store"]  = configureStore({
        reducer,
        ...getMiddleware({
            "dependencies": {
                "vaultClient": createObjectThatThrowsIfAccessed<Dependencies["vaultClient"]>(),
                keycloakClient
            }
        })
    });

    return { store, "evtVaultCliTranslation": undefined };


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
        keycloakConfig,
        paramsNeededToInitializeVaultClient,
        isPrefersColorSchemeDark,
        evtBackOnline
    } = params;

    assert(
        !keycloakConfig.doUseInMemoryClient,
        "TODO: We need a mock implementation of KeycloakClient"
    );

    const keycloakClient =
        await createImplOfKeycloakClientBasedOnOfficialAddapter(
            { keycloakConfig }
        );

    const { store, evtVaultCliTranslation  } = await (
        keycloakClient.isUserLoggedIn ?
            createStoreForLoggedUser({
                keycloakClient,
                paramsNeededToInitializeVaultClient,
                isPrefersColorSchemeDark
            }) :
            createStoreForNonLoggedUser({ keycloakClient })
    );

    dKeyCloakClient.resolve(keycloakClient);

    dStoreInstance.resolve(store);

    {

        const _common: appConstantsUseCase.AppConstant._Common = {
            isPrefersColorSchemeDark,
            "vaultConfig": paramsNeededToInitializeVaultClient.doUseInMemoryClient ?
                {
                    "baseUri": "",
                    "engine": paramsNeededToInitializeVaultClient.engine,
                    "role": ""
                }
                :
                paramsNeededToInitializeVaultClient,
            keycloakConfig
        };


        store.dispatch(
            appConstantsUseCase.privateThunks.initialize({
                "appConstants": keycloakClient.isUserLoggedIn ?
                    id<appConstantsUseCase.AppConstant.LoggedIn>({
                        "isUserLoggedIn": true,
                        ..._common,
                        "userProfile": await store.dispatch(
                            user.privateThunks.initializeAndGetUserProfile(
                                { evtBackOnline }
                            )
                        ),
                        "evtVaultCliTranslation": evtVaultCliTranslation!
                    }) :
                    id<appConstantsUseCase.AppConstant.NotLoggedIn>({
                        "isUserLoggedIn": false,
                        ..._common,
                    })
            })
        );

    }


    return store;

}

export const thunks = {
    [userProfileInVaultUseCase.name]: userProfileInVaultUseCase.thunks,
    [secretExplorerUseCase.name]: secretExplorerUseCase.thunks,
    [appConstantsUseCase.name]: appConstantsUseCase.thunks,
    [tokenUseCase.name]: tokenUseCase.thunks,
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


