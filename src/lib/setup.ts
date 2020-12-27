
import type { Action, ThunkAction } from "@reduxjs/toolkit";
import { configureStore, getDefaultMiddleware } from "@reduxjs/toolkit";
import { createInMemorySecretManagerClient } from "./secondaryAdapters/inMemorySecretsManagerClient";
import { createVaultSecretsManagerClient, getVaultClientTranslator } from "./secondaryAdapters/vaultSecretsManagerClient";
import * as secretExplorerUseCase from "./useCases/secretExplorer";
import * as userConfigsUseCase from "./useCases/userConfigs";
import * as tokensUseCase from "./useCases/tokens";
import * as appConstantsUseCase from "./useCases/appConstants";
import type { SecretsManagerClient } from "./ports/SecretsManagerClient";
import { observeSecretsManagerClientWithTranslater } from "./ports/SecretsManagerClient";
import type { AsyncReturnType } from "evt/tools/typeSafety/AsyncReturnType";
import { Deferred } from "evt/tools/Deferred";
import { assert } from "evt/tools/typeSafety/assert";
import { createObjectThatThrowsIfAccessed } from "./utils/createObjectThatThrowsIfAccessed";
import { createKeycloakOidcClient } from "./secondaryAdapters/keycloakOidcClient";
import { createInMemoryOidcClient } from "./secondaryAdapters/inMemoryOidcClient";
import type { OidcClient } from "./ports/OidcClient";
import { parseOidcAccessToken } from "./ports/OidcClient";
import { id } from "evt/tools/typeSafety/id";
import type { NonPostableEvt } from "evt";
import type { StatefulReadonlyEvt } from "evt";
import { Evt } from "evt";
import type { AxiosInstance } from "axios";
import type { OnyxiaApiClient } from "./ports/OnyxiaApiClient";
import { createInMemoryOnyxiaApiClient } from "./secondaryAdapters/inMemoryOnyxiaApiClient";
import { createRemoteOnyxiaApiClient } from "./secondaryAdapters/remoteOnyxiaApiClient";

/* ---------- Legacy ---------- */
import * as myFiles from "js/redux/myFiles";
import * as myLab from "js/redux/myLab";
import * as regions from "js/redux/regions";
import * as user from "js/redux/user";
import * as app from "js/redux/app";


export type Dependencies = {
    secretsManagerClient: SecretsManagerClient;
    evtVaultToken: StatefulReadonlyEvt<string | undefined>;
    oidcClient: OidcClient;
    onyxiaApiClient: OnyxiaApiClient;
};


export type CreateStoreParams = {
    isOsPrefersColorSchemeDark: boolean;
    secretsManagerClientConfig: SecretsManagerClientConfig;
    oidcClientConfig: OidcClientConfig;
    onyxiaApiClientConfig: OnyxiaApiClientConfig;
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

export declare type OidcClientConfig =
    OidcClientConfig.InMemory |
    OidcClientConfig.Keycloak;

export declare namespace OidcClientConfig {

    export type InMemory = {
        doUseInMemoryClient: true;
    } & Parameters<typeof createInMemoryOidcClient>[0];

    export type Keycloak = {
        doUseInMemoryClient: false;
    } & Omit<
        Parameters<typeof createKeycloakOidcClient>[0],
        "evtOidcAccessToken" |
        "renewOidcAccessTokenIfItExpiresSoonOrRedirectToLoginIfAlreadyExpired"
    >;

}

export type OnyxiaApiClientConfig =
    OnyxiaApiClientConfig.InMemory |
    OnyxiaApiClientConfig.Remote;

export declare namespace OnyxiaApiClientConfig {

    export type InMemory = {
        doUseInMemoryClient: true;
    } & Parameters<typeof createInMemoryOnyxiaApiClient>[0];

    export type Remote = {
        doUseInMemoryClient: false;
    } & Omit<
        Parameters<typeof createRemoteOnyxiaApiClient>[0],
        "getCurrentlySelectedDeployRegionId" | "oidcClient"
    >;

}


const reducer = {
    // Legacy
    [myFiles.name]: myFiles.reducer,
    [myLab.name]: myLab.reducer,
    [app.name]: app.reducer,
    [user.name]: user.reducer,
    [regions.name]: regions.reducer,

    [secretExplorerUseCase.name]: secretExplorerUseCase.reducer,
    [userConfigsUseCase.name]: userConfigsUseCase.reducer,
    [tokensUseCase.name]: tokensUseCase.reducer
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
        onyxiaApiClientConfig: OnyxiaApiClientConfig;
        oidcClient: OidcClient.LoggedIn;
    } & Pick<CreateStoreParams, "isOsPrefersColorSchemeDark">
) {

    const {
        oidcClient,
        secretsManagerClientConfig,
        onyxiaApiClientConfig,
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
                    oidcClient.evtOidcTokens.pipe(oidcTokens => [oidcTokens?.accessToken]),
                "renewOidcAccessTokenIfItExpiresSoonOrRedirectToLoginIfAlreadyExpired":
                    oidcClient.renewOidcTokensIfExpiresSoonOrRedirectToLoginIfAlreadyExpired
            });

    const {
        secretsManagerClientProxy,
        evtSecretsManagerTranslation,
    } = observeSecretsManagerClientWithTranslater({
        secretsManagerClient,
        "secretsManagerTranslator":
            getVaultClientTranslator({
                "clientType": "CLI",
                "engine": secretsManagerClientConfig.doUseInMemoryClient ?
                    "kv" : secretsManagerClientConfig.engine
            })
    });

    secretsManagerClient = secretsManagerClientProxy;

    let getCurrentlySelectedDeployRegionId: (() => string | undefined) | undefined = undefined;

    const { onyxiaApiClient, axiosInstance } =
        onyxiaApiClientConfig.doUseInMemoryClient ?
            {
                ...createInMemoryOnyxiaApiClient(onyxiaApiClientConfig),
                "axiosInstance": undefined
            } :
            createRemoteOnyxiaApiClient({
                ...onyxiaApiClientConfig,
                oidcClient,
                "getCurrentlySelectedDeployRegionId": () => {

                    assert(getCurrentlySelectedDeployRegionId !== undefined);

                    return getCurrentlySelectedDeployRegionId();

                }
            });

    if (axiosInstance !== undefined) {
        dAxiosInstance.resolve(axiosInstance);
    }

    const store = configureStore({
        reducer,
        ...getMiddleware({
            "dependencies": {
                secretsManagerClient,
                oidcClient,
                evtVaultToken,
                onyxiaApiClient
            }
        })
    });

    getCurrentlySelectedDeployRegionId = () =>
        store.getState().userConfigs.deploymentRegionId.value ?? undefined;


    store.dispatch(tokensUseCase.privateThunks.initialize());

    store.dispatch(
        secretExplorerUseCase.thunks.navigateToDirectory(
            { "directoryRelativePath": (await parseOidcAccessToken(oidcClient)).idep }
        )
    );

    await store.dispatch(
        userConfigsUseCase.privateThunks.initialize(
            { isOsPrefersColorSchemeDark }
        )
    );

    return { store, evtSecretsManagerTranslation };

}


async function createStoreForNonLoggedUser(
    params: {
        oidcClient: OidcClient.NotLoggedIn;
        onyxiaApiClientConfig: OnyxiaApiClientConfig;
    }
) {

    const { oidcClient, onyxiaApiClientConfig } = params;


    const { onyxiaApiClient, axiosInstance } =
        onyxiaApiClientConfig.doUseInMemoryClient ?
            {
                ...createInMemoryOnyxiaApiClient(onyxiaApiClientConfig),
                "axiosInstance": undefined
            } :
            createRemoteOnyxiaApiClient({
                ...onyxiaApiClientConfig,
                "oidcClient": null,
                "getCurrentlySelectedDeployRegionId": null
            });

    if (axiosInstance !== undefined) {
        dAxiosInstance.resolve(axiosInstance);
    }

    const store: AsyncReturnType<typeof createStoreForLoggedUser>["store"] = configureStore({
        reducer,
        ...getMiddleware({
            "dependencies": {
                "secretsManagerClient": createObjectThatThrowsIfAccessed<Dependencies["secretsManagerClient"]>(),
                "evtVaultToken": createObjectThatThrowsIfAccessed<Dependencies["evtVaultToken"]>(),
                oidcClient,
                onyxiaApiClient
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
        oidcClientConfig,
        secretsManagerClientConfig,
        isOsPrefersColorSchemeDark,
        onyxiaApiClientConfig,
        evtBackOnline
    } = params;


    const oidcClient = await (oidcClientConfig.doUseInMemoryClient ?
        createInMemoryOidcClient(oidcClientConfig) :
        createKeycloakOidcClient(oidcClientConfig));




    const { store, evtSecretsManagerTranslation } = await (
        oidcClient.isUserLoggedIn ?
            createStoreForLoggedUser({
                oidcClient,
                secretsManagerClientConfig,
                onyxiaApiClientConfig,
                isOsPrefersColorSchemeDark
            }) :
            {
                ...await createStoreForNonLoggedUser({
                    oidcClient,
                    onyxiaApiClientConfig
                }),
                "evtVaultCliTranslation": undefined
            }
    );


    dOidcClient.resolve(oidcClient);

    dStoreInstance.resolve(store);

    {

        const _common: appConstantsUseCase.AppConstant._Common = {
            isOsPrefersColorSchemeDark,
            "vaultClientConfig": secretsManagerClientConfig.doUseInMemoryClient ?
                { "baseUri": "", "engine": "", "role": "" } :
                secretsManagerClientConfig,
            "keycloakConfig": oidcClientConfig.doUseInMemoryClient ?
                { "clientId": "fake client id", "realm": "fake realm" } :
                oidcClientConfig.keycloakConfig
        };


        store.dispatch(
            appConstantsUseCase.privateThunks.initialize({
                "appConstants": oidcClient.isUserLoggedIn ?
                    id<appConstantsUseCase.AppConstant.LoggedIn>({
                        "isUserLoggedIn": true,
                        ..._common,
                        "userProfile": await store.dispatch(
                            user.privateThunks.initializeAndGetUserProfile(
                                { evtBackOnline }
                            )
                        ),
                        "evtSecretsManagerTranslation": evtSecretsManagerTranslation!
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
    [userConfigsUseCase.name]: userConfigsUseCase.thunks,
    [secretExplorerUseCase.name]: secretExplorerUseCase.thunks,
    [appConstantsUseCase.name]: appConstantsUseCase.thunks,
    [tokensUseCase.name]: tokensUseCase.thunks,
    [app.name]: app.thunk
};

export const pure = {
    [secretExplorerUseCase.name]: secretExplorerUseCase.pure
};

export type Store = AsyncReturnType<typeof createStore>;

export type RootState = ReturnType<Store["getState"]>;

export type AppThunk<ReturnType = Promise<void>> = ThunkAction<
    ReturnType,
    RootState,
    Dependencies,
    Action<string>
>;


const dAxiosInstance = new Deferred<AxiosInstance>();

/** @deprecated */
export const { pr: prAxiosInstance } = dAxiosInstance;

const dStoreInstance = new Deferred<Store>();

/** 
 * A promise that resolve to the store instance.
 * If createStore isn't called it's pending forever.
 * 
 * @deprecated: use "js/react/hooks" to interact with the store.
 */
export const { pr: prStore } = dStoreInstance;

const dOidcClient = new Deferred<OidcClient>();

/** @deprecated */
export const { pr: prOidcClient } = dOidcClient;


