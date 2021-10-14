import type { Action, ThunkAction as GenericThunkAction } from "@reduxjs/toolkit";
import { configureStore } from "@reduxjs/toolkit";
import { createLocalStorageSecretManagerClient } from "./secondaryAdapters/localStorageSecretsManagerClient";
import { createVaultSecretsManagerClient } from "./secondaryAdapters/vaultSecretsManagerClient";
import { createJwtUserApiClient } from "./secondaryAdapters/jwtUserApiClient";
import * as secretExplorerUseCase from "./useCases/secretExplorer";
import * as userConfigsUseCase from "./useCases/userConfigs";
import * as launcherUseCase from "./useCases/launcher";
import * as catalogExplorerUseCase from "./useCases/catalogExplorer";
import * as runningServiceUseCase from "./useCases/runningService";
import * as restorablePackageConfigsUseCase from "./useCases/restorablePackageConfigs";
import * as publicIpUseCase from "./useCases/publicIp";
import * as userAuthenticationUseCase from "./useCases/userAuthentication";
import * as deploymentRegionUseCase from "./useCases/deploymentRegion";
import type { UserApiClient, User } from "./ports/UserApiClient";
import type { SecretsManagerClient } from "./ports/SecretsManagerClient";
import type { ReturnType } from "tsafe/ReturnType";
import { Deferred } from "evt/tools/Deferred";
import { createObjectThatThrowsIfAccessed } from "./tools/createObjectThatThrowsIfAccessed";
import { createKeycloakOidcClient } from "./secondaryAdapters/keycloakOidcClient";
import {
    createPhonyOidcClient,
    phonyClientOidcClaims,
} from "./secondaryAdapters/phonyOidcClient";
import type { OidcClient } from "./ports/OidcClient";
import type { OnyxiaApiClient } from "./ports/OnyxiaApiClient";
import { createMockOnyxiaApiClient } from "./secondaryAdapters/mockOnyxiaApiClient";
import { createOfficialOnyxiaApiClient } from "./secondaryAdapters/officialOnyxiaApiClient";
import type { Param0, Equals } from "tsafe";
import { assert } from "tsafe/assert";
import { id } from "tsafe/id";
import type { KcLanguageTag } from "keycloakify";

/* ---------- Legacy ---------- */
import * as myFiles from "js/redux/myFiles";
import * as myLab from "js/redux/myLab";
import * as user from "js/redux/user";
import * as app from "js/redux/app";

export type CreateStoreParams = {
    /**
     * not that we are going to change anything about the UI from src/lib
     * but we want to be able to provide a good default for state.userConfigs.isDarkModeEnabled
     * when it's the first time the user logs in and the value hasn't been stored yet in vault.
     * */
    getIsDarkModeEnabledValueForProfileInitialization(): boolean;
    oidcClientConfig: OidcClientConfig;
    onyxiaApiClientConfig: OnyxiaApiClientConfig;
    userApiClientConfig: UserApiClientConfig;
    secretsManagerClientConfig: SecretsManagerClientConfig;
};

export type UserApiClientConfig = UserApiClientConfig.Jwt | UserApiClientConfig.Mock;
export declare namespace UserApiClientConfig {
    export type Jwt = {
        implementation: "JWT";
    } & Omit<Param0<typeof createJwtUserApiClient>, "getIp" | "getOidcAccessToken">;

    export type Mock = {
        implementation: "MOCK";
        user: User;
    };
}

assert<
    Equals<
        UserApiClientConfig,
        | {
              implementation: "JWT";
              oidcClaims: {
                  email: string;
                  familyName: string;
                  firstName: string;
                  username: string;
                  groups: string;
                  local: string;
              };
          }
        | {
              implementation: "MOCK";
              user: {
                  email: string;
                  familyName: string; //Obama
                  firstName: string; //Barack
                  username: string; //obarack, the idep
                  groups: string[];
                  local: KcLanguageTag;
              };
          }
    >
>();

export declare type SecretsManagerClientConfig =
    | SecretsManagerClientConfig.LocalStorage
    | SecretsManagerClientConfig.Vault;
export declare namespace SecretsManagerClientConfig {
    export type Vault = {
        implementation: "VAULT";
    } & Param0<typeof createVaultSecretsManagerClient>;

    export type LocalStorage = {
        implementation: "LOCAL STORAGE";
        paramsForTranslator: { engine: string };
    } & Param0<typeof createLocalStorageSecretManagerClient>;
}

assert<
    Equals<
        SecretsManagerClientConfig,
        | {
              implementation: "VAULT";
              baseUri: string;
              engine: string;
              role: string;
              keycloakParams: {
                  url: string;
                  realm: string;
                  clientId: string;
              };
          }
        | {
              implementation: "LOCAL STORAGE";
              paramsForTranslator: { engine: string };
              artificialDelayMs: number;
              doReset: boolean;
          }
    >
>();

export declare type OidcClientConfig = OidcClientConfig.Phony | OidcClientConfig.Keycloak;
export declare namespace OidcClientConfig {
    export type Phony = {
        implementation: "PHONY";
    } & Omit<Param0<typeof createPhonyOidcClient>, "user">;

    export type Keycloak = {
        implementation: "KEYCLOAK";
    } & Param0<typeof createKeycloakOidcClient>;
}

assert<
    Equals<
        OidcClientConfig,
        | {
              implementation: "PHONY";
              isUserLoggedIn: boolean;
          }
        | {
              implementation: "KEYCLOAK";
              url: string;
              realm: string;
              clientId: string;
          }
    >
>();

export type OnyxiaApiClientConfig =
    | OnyxiaApiClientConfig.Mock
    | OnyxiaApiClientConfig.Official;

export declare namespace OnyxiaApiClientConfig {
    export type Mock = {
        implementation: "MOCK";
    } & Param0<typeof createMockOnyxiaApiClient>;

    export type Official = {
        implementation: "OFFICIAL";
    } & Omit<
        Param0<typeof createOfficialOnyxiaApiClient>,
        "getCurrentlySelectedDeployRegionId" | "getOidcAccessToken"
    >;
}

assert<
    Equals<
        OnyxiaApiClientConfig,
        | {
              implementation: "MOCK";
              availableDeploymentRegions: {
                  id: string;
                  s3MonitoringUrlPattern?: string;
                  namespacePrefix: string;
              }[];
          }
        | {
              implementation: "OFFICIAL";
              url: string;
          }
    >
>();

export type ThunksExtraArgument = {
    createStoreParams: CreateStoreParams;
    secretsManagerClient: SecretsManagerClient;
    userApiClient: UserApiClient;
    oidcClient: OidcClient;
    onyxiaApiClient: OnyxiaApiClient;
};

createStore.isFirstInvocation = true;

export async function createStore(params: CreateStoreParams) {
    assert(
        createStore.isFirstInvocation,
        "createStore has already been called, " +
            "only one instance of the store is supposed to" +
            "be created",
    );

    createStore.isFirstInvocation = false;

    const { oidcClientConfig } = params;

    const oidcClient = await (() => {
        switch (oidcClientConfig.implementation) {
            case "PHONY":
                return createPhonyOidcClient({
                    "isUserLoggedIn": oidcClientConfig.isUserLoggedIn,
                    "user": (() => {
                        const { userApiClientConfig } = params;

                        assert(
                            userApiClientConfig.implementation === "MOCK",
                            [
                                "if oidcClientConfig.implementation is 'PHONY' then",
                                "userApiClientConfig.implementation should be 'MOCK'",
                            ].join(" "),
                        );

                        return userApiClientConfig.user;
                    })(),
                });
            case "KEYCLOAK":
                return createKeycloakOidcClient(oidcClientConfig);
        }
    })();

    dOidcClient.resolve(oidcClient);

    let getCurrentlySelectedDeployRegionId: (() => string) | undefined = undefined;

    const onyxiaApiClient = (() => {
        const { onyxiaApiClientConfig } = params;
        switch (onyxiaApiClientConfig.implementation) {
            case "MOCK":
                return createMockOnyxiaApiClient(onyxiaApiClientConfig);
            case "OFFICIAL":
                return createOfficialOnyxiaApiClient({
                    "url": onyxiaApiClientConfig.url,
                    "getCurrentlySelectedDeployRegionId": () =>
                        getCurrentlySelectedDeployRegionId?.(),
                    "getOidcAccessToken": !oidcClient.isUserLoggedIn
                        ? undefined
                        : oidcClient.getAccessToken,
                });
        }
    })();

    const secretsManagerClient = oidcClient.isUserLoggedIn
        ? await (async () => {
              const { secretsManagerClientConfig } = params;
              switch (secretsManagerClientConfig.implementation) {
                  case "LOCAL STORAGE":
                      return createLocalStorageSecretManagerClient(
                          secretsManagerClientConfig,
                      );
                  case "VAULT":
                      return createVaultSecretsManagerClient(secretsManagerClientConfig);
              }
          })()
        : createObjectThatThrowsIfAccessed<SecretsManagerClient>();

    const userApiClient = oidcClient.isUserLoggedIn
        ? createJwtUserApiClient({
              "oidcClaims": (() => {
                  const { userApiClientConfig } = params;

                  switch (userApiClientConfig.implementation) {
                      case "JWT":
                          return userApiClientConfig.oidcClaims;
                      case "MOCK":
                          return phonyClientOidcClaims;
                  }
              })(),
              "getOidcAccessToken": oidcClient.getAccessToken,
          })
        : createObjectThatThrowsIfAccessed<UserApiClient>();

    const store = configureStore({
        "reducer": {
            // Legacy
            [myFiles.name]: myFiles.reducer,
            [myLab.name]: myLab.reducer,
            [app.name]: app.reducer,
            [user.name]: user.reducer,

            [secretExplorerUseCase.name]: secretExplorerUseCase.reducer,
            [userConfigsUseCase.name]: userConfigsUseCase.reducer,
            [catalogExplorerUseCase.name]: catalogExplorerUseCase.reducer,
            [launcherUseCase.name]: launcherUseCase.reducer,
            [restorablePackageConfigsUseCase.name]:
                restorablePackageConfigsUseCase.reducer,
            [runningServiceUseCase.name]: runningServiceUseCase.reducer,
            [publicIpUseCase.name]: publicIpUseCase.reducer,
            [deploymentRegionUseCase.name]: deploymentRegionUseCase.reducer,
        },
        "middleware": getDefaultMiddleware =>
            getDefaultMiddleware({
                "thunk": {
                    "extraArgument": id<ThunksExtraArgument>({
                        "createStoreParams": params,
                        oidcClient,
                        onyxiaApiClient,
                        secretsManagerClient,
                        userApiClient,
                    }),
                },
            }),
    });

    dStoreInstance.resolve(store);

    if (oidcClient.isUserLoggedIn) {
        store.dispatch(secretExplorerUseCase.privateThunks.initialize());
    }

    await store.dispatch(userAuthenticationUseCase.privateThunks.initialize());
    if (oidcClient.isUserLoggedIn) {
        await store.dispatch(userConfigsUseCase.privateThunks.initialize());
    }

    if (oidcClient.isUserLoggedIn) {
        store.dispatch(restorablePackageConfigsUseCase.privateThunks.initialize());
    }

    await store.dispatch(deploymentRegionUseCase.privateThunks.initialize());
    getCurrentlySelectedDeployRegionId = () =>
        store.getState().deploymentRegion.selectedDeploymentRegionId;

    return store;
}

export type Store = ReturnType<typeof createStore>;

export type RootState = ReturnType<Store["getState"]>;

export type ThunkAction<ReturnType = Promise<void>> = GenericThunkAction<
    ReturnType,
    RootState,
    ThunksExtraArgument,
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

const dOidcClient = new Deferred<OidcClient>();

/** @deprecated */
export const { pr: prOidcClient } = dOidcClient;
