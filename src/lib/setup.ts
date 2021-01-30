
import type { Action, ThunkAction } from "@reduxjs/toolkit";
import { configureStore, getDefaultMiddleware } from "@reduxjs/toolkit";
import { createLocalStorageSecretManagerClient } from "./secondaryAdapters/localStorageSecretsManagerClient";
import { createVaultSecretsManagerClient, getVaultClientTranslator } from "./secondaryAdapters/vaultSecretsManagerClient";
import * as secretExplorerUseCase from "./useCases/secretExplorer";
import * as userConfigsUseCase from "./useCases/userConfigs";
import * as tokensUseCase from "./useCases/tokens";
import * as appConstantsUseCase from "./useCases/appConstants";
import type { SecretsManagerClient } from "./ports/SecretsManagerClient";
import { observeSecretsManagerClientWithTranslator } from "./ports/SecretsManagerClient";
import type { AsyncReturnType } from "evt/tools/typeSafety/AsyncReturnType";
import { Deferred } from "evt/tools/Deferred";
import { assert } from "evt/tools/typeSafety/assert";
import { createObjectThatThrowsIfAccessed } from "./tools/createObjectThatThrowsIfAccessed";
import { createKeycloakOidcClient } from "./secondaryAdapters/keycloakOidcClient";
import { createPhonyOidcClient } from "./secondaryAdapters/phonyOidcClient";
import type { OidcClient } from "./ports/OidcClient";
import { id } from "evt/tools/typeSafety/id";
import type { NonPostableEvt } from "evt";
import type { StatefulReadonlyEvt } from "evt";
import { Evt } from "evt";
import type { AxiosInstance } from "axios";
import type { OnyxiaApiClient } from "./ports/OnyxiaApiClient";
import { createMockOnyxiaApiClient } from "./secondaryAdapters/mockOnyxiaApiClient";
import { createOfficialOnyxiaApiClient } from "./secondaryAdapters/officialOnyxiaApiClient";

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
    SecretsManagerClientConfig.LocalStorage |
    SecretsManagerClientConfig.Vault;

export declare namespace SecretsManagerClientConfig {

    export type Vault = {
        implementation: "VAULT";
    } & Omit<Parameters<typeof createVaultSecretsManagerClient>[0],
        "evtOidcAccessToken" |
        "renewOidcAccessTokenIfItExpiresSoonOrRedirectToLoginIfAlreadyExpired"
    >;

    export type LocalStorage = {
        implementation: "LOCAL STORAGE";
        paramsForTranslator: Pick<Vault, "role" | "baseUri" | "engine">;
    } & Parameters<typeof createLocalStorageSecretManagerClient>[0];


}

export declare type OidcClientConfig =
    OidcClientConfig.Phony |
    OidcClientConfig.Keycloak;

export declare namespace OidcClientConfig {

    export type Phony = {
        implementation: "PHONY";
    } & Parameters<typeof createPhonyOidcClient>[0];

    export type Keycloak = {
        implementation: "KEYCLOAK";
    } & Omit<
        Parameters<typeof createKeycloakOidcClient>[0],
        "evtOidcAccessToken" |
        "renewOidcAccessTokenIfItExpiresSoonOrRedirectToLoginIfAlreadyExpired"
    >;

}

export type OnyxiaApiClientConfig =
    OnyxiaApiClientConfig.Mock |
    OnyxiaApiClientConfig.Official;

export declare namespace OnyxiaApiClientConfig {

    export type Mock = {
        implementation: "MOCK";
    } & Parameters<typeof createMockOnyxiaApiClient>[0];

    export type Official = {
        implementation: "OFFICIAL";
    } & Omit<
        Parameters<typeof createOfficialOnyxiaApiClient>[0],
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

    let { secretsManagerClient, evtVaultToken, secretsManagerTranslator } = (() => {

        const clientType = "CLI";

        switch (secretsManagerClientConfig.implementation) {
            case "LOCAL STORAGE": {

                const { paramsForTranslator, ...params } = secretsManagerClientConfig;

                return {
                    ...createLocalStorageSecretManagerClient(params),
                    "evtVaultToken": Evt.create<string | undefined>(
                        "We are not currently using Vault for secret management"
                    ),
                    "secretsManagerTranslator": getVaultClientTranslator({
                        clientType,
                        "oidcAccessToken": oidcClient.evtOidcTokens.state!.accessToken,
                        ...paramsForTranslator
                    })
                };

            }
            case "VAULT": {

                const params: Parameters<typeof createVaultSecretsManagerClient>[0] = {
                    ...secretsManagerClientConfig,
                    "evtOidcAccessToken":
                        oidcClient.evtOidcTokens.pipe(oidcTokens => [oidcTokens?.accessToken]),
                    "renewOidcAccessTokenIfItExpiresSoonOrRedirectToLoginIfAlreadyExpired":
                        oidcClient.renewOidcTokensIfExpiresSoonOrRedirectToLoginIfAlreadyExpired
                };

                const {
                    evtOidcAccessToken: { state: oidcAccessToken },
                    ...translatorParams
                } = params;

                assert(oidcAccessToken !== undefined);

                return {
                    ...createVaultSecretsManagerClient(params),
                    "secretsManagerTranslator": getVaultClientTranslator({
                        clientType,
                        oidcAccessToken,
                        ...translatorParams
                    })
                };
            }
        }
    })();

    const {
        secretsManagerClientProxy,
        getEvtSecretsManagerTranslation
    } = observeSecretsManagerClientWithTranslator({
        secretsManagerClient,
        secretsManagerTranslator
    });

    secretsManagerClient = secretsManagerClientProxy;

    let getCurrentlySelectedDeployRegionId: (() => string | undefined) | undefined = undefined;

    const { onyxiaApiClient, axiosInstance } = (() => {
        switch (onyxiaApiClientConfig.implementation) {
            case "MOCK": return {
                ...createMockOnyxiaApiClient(onyxiaApiClientConfig),
                "axiosInstance": undefined
            };
            case "OFFICIAL": return createOfficialOnyxiaApiClient({
                ...onyxiaApiClientConfig,
                oidcClient,
                "getCurrentlySelectedDeployRegionId": () => {

                    assert(getCurrentlySelectedDeployRegionId !== undefined);

                    return getCurrentlySelectedDeployRegionId();

                }
            });
        }
    })();

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

    await store.dispatch(
        userConfigsUseCase.privateThunks.initialize(
            { isOsPrefersColorSchemeDark }
        )
    );

    return { store, getEvtSecretsManagerTranslation };

}


async function createStoreForNonLoggedUser(
    params: {
        oidcClient: OidcClient.NotLoggedIn;
        onyxiaApiClientConfig: OnyxiaApiClientConfig;
    }
) {

    const { oidcClient, onyxiaApiClientConfig } = params;

    const { onyxiaApiClient, axiosInstance } = (() => {
        switch (onyxiaApiClientConfig.implementation) {
            case "MOCK": return {
                ...createMockOnyxiaApiClient(onyxiaApiClientConfig),
                "axiosInstance": undefined
            };
            case "OFFICIAL": return createOfficialOnyxiaApiClient({
                ...onyxiaApiClientConfig,
                "oidcClient": null,
                "getCurrentlySelectedDeployRegionId": null
            });
        }
    })();

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

    const oidcClient = await (() => {
        switch (oidcClientConfig.implementation) {
            case "PHONY": return createPhonyOidcClient(oidcClientConfig);
            case "KEYCLOAK": return createKeycloakOidcClient(oidcClientConfig);
        }
    })();

    const { store, getEvtSecretsManagerTranslation } = await (
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
                "getEvtSecretsManagerTranslation": undefined
            }
    );

    dOidcClient.resolve(oidcClient);

    dStoreInstance.resolve(store);

    store.dispatch(
        appConstantsUseCase.privateThunks.initialize({
            "appConstants": await (async () => {

                const _common: appConstantsUseCase.AppConstant._Common = {
                    isOsPrefersColorSchemeDark,
                    "vaultClientConfig": (() => {
                        switch (secretsManagerClientConfig.implementation) {
                            case "VAULT": return secretsManagerClientConfig;
                            case "LOCAL STORAGE": return { "baseUri": "", "engine": "", "role": "" };
                        }
                    })(),
                    "keycloakConfig": (() => {
                        switch (oidcClientConfig.implementation) {
                            case "PHONY":
                                const message = [
                                    "N.A. This instance is not configured to use Keycloak but",
                                    "a phony implementation of the OIDC client"
                                ].join(" ");
                                return { "clientId": message, "realm": message };
                            case "KEYCLOAK": return oidcClientConfig.keycloakConfig;
                        }
                    })()
                };

                return oidcClient.isUserLoggedIn ?
                    id<appConstantsUseCase.AppConstant.LoggedIn>({
                        "isUserLoggedIn": true,
                        ..._common,
                        "userProfile": await store.dispatch(
                            user.privateThunks.initializeAndGetUserProfile(
                                { evtBackOnline }
                            )
                        ),
                        "getEvtSecretsManagerTranslation": getEvtSecretsManagerTranslation!
                    }) :
                    id<appConstantsUseCase.AppConstant.NotLoggedIn>({
                        "isUserLoggedIn": false,
                        ..._common,
                    })

            })()

        })
    );



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


