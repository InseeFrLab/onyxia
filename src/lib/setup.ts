
import type { Action, ThunkAction } from "@reduxjs/toolkit";
import { configureStore, getDefaultMiddleware } from "@reduxjs/toolkit";
import { createInMemorySecretManagerClient } from "./secondaryAdapters/inMemorySecretsManagerClient";
import { createVaultSecretsManagerClient, getVaultClientTranslator } from "./secondaryAdapters/vaultSecretsManagerClient";
import * as secretExplorerUseCase from "./useCases/secretExplorer";
import * as userProfileInVaultUseCase from "./useCases/userConfigs";
import * as tokenUseCase from "./useCases/tokens";
import * as appConstantsUseCase from "./useCases/appConstants";
import type { SecretsManagerClient } from "./ports/SecretsManagerClient";
import { getVaultClientProxyWithTranslator } from "./ports/SecretsManagerClient";
import type { AsyncReturnType } from "evt/tools/typeSafety/AsyncReturnType";
import { Deferred } from "evt/tools/Deferred";
import { assert } from "evt/tools/typeSafety/assert";
import { createObjectThatThrowsIfAccessed } from "./utils/createObjectThatThrowsIfAccessed";
import { createImplOfKeycloakClientBasedOnOfficialAddapter } from "./secondaryAdapters/basedOnOfficialAdapterKeycloakClient";
import type { KeycloakClient } from "./ports/KeycloakClient";
import { parseOidcAccessToken } from "./ports/KeycloakClient";
import { id } from "evt/tools/typeSafety/id";
import type { NonPostableEvt } from "evt";
import type { StatefulReadonlyEvt } from "evt";
import { Evt } from "evt";

/* ---------- Legacy ---------- */
import * as myFiles from "js/redux/myFiles";
import * as myLab from "js/redux/myLab";
import * as regions from "js/redux/regions";
import * as user from "js/redux/user";
import * as app from "js/redux/app";


export type Dependencies = {
    secretsManagerClient: SecretsManagerClient;
    evtVaultToken: StatefulReadonlyEvt<string | undefined>;
    keycloakClient: KeycloakClient;
};


export type CreateStoreParams = {
    isOsPrefersColorSchemeDark: boolean;
    secretsManagerClientConfig: SecretsManagerClientConfig;
    keycloakConfig: KeycloakConfig;
    evtBackOnline: NonPostableEvt<void>;
};

export declare type SecretsManagerClientConfig =
    SecretsManagerClientConfig.InMemory |
    SecretsManagerClientConfig.Vault;

export declare namespace SecretsManagerClientConfig {

    export type InMemory = {
        doUseInMemoryClient: true;
    };

    export type Vault = {
        doUseInMemoryClient: false;
    } & Omit<Parameters<typeof createVaultSecretsManagerClient>[0],
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
        secretsManagerClientConfig: SecretsManagerClientConfig;
        keycloakClient: KeycloakClient.LoggedIn;
    } & Pick<CreateStoreParams, "isOsPrefersColorSchemeDark">
) {

    const {
        keycloakClient,
        secretsManagerClientConfig,
        isOsPrefersColorSchemeDark
    } = params;


    let { secretsManagerClient, evtVaultToken } =
        secretsManagerClientConfig.doUseInMemoryClient ?
            {
                "secretsManagerClient": createInMemorySecretManagerClient(),
                "evtVaultToken": Evt.create<string | undefined>([
                    "We are not currently using Vault as secret manager",
                    "secrets are stored in RAM. There is no vault token"
                ].join(" "))
            } :
            createVaultSecretsManagerClient({
                ...secretsManagerClientConfig,
                "evtOidcAccessToken":
                    keycloakClient.evtOidcTokens.pipe(oidcTokens => [oidcTokens?.accessToken]),
                "renewOidcAccessTokenIfItExpiresSoonOrRedirectToLoginIfAlreadyExpired":
                    keycloakClient.renewOidcTokensIfExpiresSoonOrRedirectToLoginIfAlreadyExpired
            });

    const {
        secretsManagerClientProxy,
        evtTranslation: evtVaultCliTranslation,
    } = getVaultClientProxyWithTranslator({
        secretsManagerClient,
        "vaultClientTranslator":
            getVaultClientTranslator({
                "clientType": "CLI",
                "engine": secretsManagerClientConfig.doUseInMemoryClient ?
                    "kv" : secretsManagerClientConfig.engine
            })
    });

    secretsManagerClient = secretsManagerClientProxy;

    const store = configureStore({
        reducer,
        ...getMiddleware({
            "dependencies": {
                secretsManagerClient,
                keycloakClient,
                evtVaultToken
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
        userProfileInVaultUseCase.privateThunks.initialize(
            { isOsPrefersColorSchemeDark }
        )
    );

    return { store, evtVaultCliTranslation };

}


async function createStoreForNonLoggedUser(
    params: { keycloakClient: KeycloakClient.NotLoggedIn; }
) {

    const { keycloakClient } = params;
    const store: AsyncReturnType<typeof createStoreForLoggedUser>["store"] = configureStore({
        reducer,
        ...getMiddleware({
            "dependencies": {
                "secretsManagerClient": createObjectThatThrowsIfAccessed<Dependencies["secretsManagerClient"]>(),
                "evtVaultToken": createObjectThatThrowsIfAccessed<Dependencies["evtVaultToken"]>(),
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
        keycloakConfig,
        secretsManagerClientConfig,
        isOsPrefersColorSchemeDark,
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

    const { store, evtVaultCliTranslation } = await (
        keycloakClient.isUserLoggedIn ?
            createStoreForLoggedUser({
                keycloakClient,
                secretsManagerClientConfig,
                isOsPrefersColorSchemeDark
            }) :
            {
                ...await createStoreForNonLoggedUser({ keycloakClient }),
                "evtVaultCliTranslation": undefined
            }
    );

    dKeyCloakClient.resolve(keycloakClient);

    dStoreInstance.resolve(store);

    {

        const _common: appConstantsUseCase.AppConstant._Common = {
            isOsPrefersColorSchemeDark,
            "vaultClientConfig": secretsManagerClientConfig.doUseInMemoryClient ?
                { "baseUri": "", "engine": "", "role": "" } :
                secretsManagerClientConfig,
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


