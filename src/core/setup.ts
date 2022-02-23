/* eslint-disable react-hooks/rules-of-hooks */
import type { Action, ThunkAction as GenericThunkAction } from "@reduxjs/toolkit";
import { configureStore } from "@reduxjs/toolkit";
import { createLocalStorageSecretManagerClient } from "./secondaryAdapters/localStorageSecretsManagerClient";
import { createVaultSecretsManagerClient } from "./secondaryAdapters/vaultSecretsManagerClient";
import { createJwtUserApiClient } from "./secondaryAdapters/jwtUserApiClient";
import { createS3Client, getCreateS3ClientParams } from "./secondaryAdapters/s3Client";
import { createDummyS3Client } from "./secondaryAdapters/dummyS3Client";
import * as catalogExplorerUseCase from "./usecases/catalogExplorer";
import * as deploymentRegionUseCase from "./usecases/deploymentRegion";
import * as explorersUseCase from "./usecases/explorers";
import * as launcherUseCase from "./usecases/launcher";
import * as projectConfigUseCase from "./usecases/projectConfigs";
import * as projectSelectionUseCase from "./usecases/projectSelection";
import * as publicIpUseCase from "./usecases/publicIp";
import * as restorablePackageConfigsUseCase from "./usecases/restorablePackageConfigs";
import * as runningServiceUseCase from "./usecases/runningService";
import * as userAuthenticationUseCase from "./usecases/userAuthentication";
import * as userConfigsUseCase from "./usecases/userConfigs";
import * as secretsEditorUseCase from "./usecases/secretsEditor";

import type { UserApiClient, User } from "./ports/UserApiClient";
import type { SecretsManagerClient } from "./ports/SecretsManagerClient";
import type { S3Client } from "./ports/S3Client";
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
import type { KcLanguageTag } from "keycloakify";
import { usecasesToReducer } from "redux-clean-architecture";
import { createMiddlewareEvtActionFactory } from "redux-clean-architecture/middlewareEvtAction";

/* ---------- Legacy ---------- */
import * as myFiles from "js/redux/myFiles";
import * as myLab from "js/redux/myLab";
import * as user from "js/redux/user";
import * as app from "js/redux/app";

export type CreateStoreParams = {
    /**
     * not that we are going to change anything about the UI from src/core
     * but we want to be able to provide a good default for state.userConfigs.isDarkModeEnabled
     * when it's the first time the user logs in and the value hasn't been stored yet in vault.
     * */
    getIsDarkModeEnabledValueForProfileInitialization: () => boolean;
    oidcClientConfig: OidcClientConfig;
    onyxiaApiClientConfig: OnyxiaApiClientConfig;
    userApiClientConfig: UserApiClientConfig;
    secretsManagerClientConfig: SecretsManagerClientConfig;
    highlightedPackages: string[];
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

// All these assert<Equals<...>> are just here to help visualize what the type
// actually is. It's hard to tell just by looking at the definition
// with all these Omit, Pick Param0<typeof ...>.
// It could have been just a comment but comment lies. Instead here
// we are forced, if we update the types, to update the asserts statement
// or else we get red squiggly lines.
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
              url: string;
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
        | "getCurrentlySelectedDeployRegionId"
        | "getOidcAccessToken"
        | "getCurrentlySelectedProjectId"
    >;
}

assert<
    Equals<
        OnyxiaApiClientConfig,
        | {
              implementation: "MOCK";
              availableDeploymentRegions: {
                  id: string;
                  defaultIpProtection: boolean | undefined;
                  servicesMonitoringUrlPattern: string | undefined;
                  defaultNetworkPolicy: boolean | undefined;
                  kubernetesClusterDomain: string;
                  initScriptUrl: string;
                  s3:
                      | {
                            defaultDurationSeconds?: number;
                            monitoringUrlPattern?: string;
                            keycloakParams?: {
                                url: string;
                                clientId: string | undefined;
                                realm: string | undefined;
                            };
                        } & (
                            | {
                                  type: "minio";
                                  url: string; //"https://minio.sspcloud.fr",
                                  region: string | undefined; // default "us-east-1"
                              }
                            | {
                                  type: "amazon";
                                  region: string; //"us-east-1"
                                  roleARN: string; //"arn:aws:iam::873875581780:role/test";
                                  roleSessionName: string; //"onyxia";
                              }
                            | {
                                  type: "disabled";
                              }
                        );
              }[];
          }
        | {
              implementation: "OFFICIAL";
              url: string;
          }
    >
>();

export const usecases = [
    myFiles,
    myLab,
    app,
    user,
    catalogExplorerUseCase,
    deploymentRegionUseCase,
    explorersUseCase,
    launcherUseCase,
    projectConfigUseCase,
    projectSelectionUseCase,
    publicIpUseCase,
    restorablePackageConfigsUseCase,
    runningServiceUseCase,
    userAuthenticationUseCase,
    userConfigsUseCase,
    secretsEditorUseCase,
];

const { createMiddlewareEvtAction } = createMiddlewareEvtActionFactory(usecases);

export type ThunksExtraArgument = {
    createStoreParams: CreateStoreParams;
    secretsManagerClient: SecretsManagerClient;
    userApiClient: UserApiClient;
    oidcClient: OidcClient;
    onyxiaApiClient: OnyxiaApiClient;
    s3Client: S3Client;
    evtAction: ReturnType<typeof createMiddlewareEvtAction>["evtAction"];
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
    let getCurrentlySelectedProjectId: (() => string) | undefined = undefined;

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
                    "getCurrentlySelectedProjectId": () =>
                        getCurrentlySelectedProjectId?.(),
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

    const { evtAction, middlewareEvtAction } = createMiddlewareEvtAction();

    const extraArgument: ThunksExtraArgument = {
        "createStoreParams": params,
        oidcClient,
        onyxiaApiClient,
        secretsManagerClient,
        userApiClient,
        "s3Client": createObjectThatThrowsIfAccessed<S3Client>({
            "debugMessage": "s3 client is not yet initialized",
        }),
        evtAction,
    };

    const store = configureStore({
        "reducer": usecasesToReducer(usecases),
        "middleware": getDefaultMiddleware =>
            [
                ...getDefaultMiddleware({
                    "thunk": { extraArgument },
                }),
                middlewareEvtAction,
            ] as const,
    });

    dStoreInstance.resolve(store);

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

    if (oidcClient.isUserLoggedIn) {
        const { s3: regionS3 } =
            deploymentRegionUseCase.selectors.selectedDeploymentRegion(store.getState());

        extraArgument.s3Client = await (async () => {
            if (regionS3.type === "disabled") {
                return createDummyS3Client();
            }

            return createS3Client({
                ...getCreateS3ClientParams({
                    regionS3,
                    "fallbackKeycloakParams":
                        oidcClientConfig.implementation === "KEYCLOAK"
                            ? oidcClientConfig
                            : undefined,
                }),
                "createAwsBucket": onyxiaApiClient.createAwsBucket,
            });
        })();
    }

    if (oidcClient.isUserLoggedIn) {
        await store.dispatch(projectSelectionUseCase.privateThunks.initialize());
        getCurrentlySelectedProjectId = () =>
            store.getState().projectSelection.selectedProjectId;
    }

    store.dispatch(runningServiceUseCase.privateThunks.initialize());

    return store;
}

export type Store = ReturnType<typeof createStore>;

export type RootState = ReturnType<Store["getState"]>;

export type Dispatch = Store["dispatch"];

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
