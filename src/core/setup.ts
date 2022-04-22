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

import type { UserApiClient } from "./ports/UserApiClient";
import type { SecretsManagerClient } from "./ports/SecretsManagerClient";
import type { S3Client } from "./ports/S3Client";
import type { ReturnType } from "tsafe/ReturnType";
import { Deferred } from "evt/tools/Deferred";
import { createObjectThatThrowsIfAccessed } from "./tools/createObjectThatThrowsIfAccessed";
import { createKeycloakOidcClient } from "./secondaryAdapters/keycloakOidcClient";
import { createPhonyOidcClient } from "./secondaryAdapters/phonyOidcClient";
import type { OidcClient } from "./ports/OidcClient";
import type { OnyxiaApiClient } from "./ports/OnyxiaApiClient";
import { createMockOnyxiaApiClient } from "./secondaryAdapters/mockOnyxiaApiClient";
import { createOfficialOnyxiaApiClient } from "./secondaryAdapters/officialOnyxiaApiClient";
import { assert } from "tsafe/assert";
import { usecasesToReducer } from "redux-clean-architecture";
import { createMiddlewareEvtActionFactory } from "redux-clean-architecture/middlewareEvtAction";
import type { User } from "./ports/UserApiClient";
import type { Param0 } from "tsafe";
import type { NonPostableEvt } from "evt";

/* ---------- Legacy ---------- */
import * as myFiles from "js/redux/myFiles";
import * as myLab from "js/redux/myLab";
import * as user from "js/redux/user";
import * as app from "js/redux/app";

export type CreateStoreParams = {
    /** undefined for a mock implementation, undefined for /api or a specific url */
    onyxiaApiUrl: string | undefined;

    userAuthenticationParams:
        | {
              method: "keycloak";
              keycloakParams: {
                  url: string;
                  realm: string;
                  clientId: string;
                  jwtClaims: Record<keyof User, string>;
              };
              transformUrlBeforeRedirectToLogin: (url: string) => string;
          }
        | {
              method: "mock";
              isUserInitiallyLoggedIn: boolean;
              user: User;
          };

    /**
     * Note that we are going to change anything about the UI from src/core
     * but we want to be able to provide a good default for state.userConfigs.isDarkModeEnabled
     * when it's the first time the user logs in and the value hasn't been stored yet in vault.
     * */
    getIsDarkModeEnabledValueForProfileInitialization: () => boolean;
    vaultParams:
        | undefined
        | {
              url: string;
              engine: string;
              role: string;
              /** If undefined we will use the root keycloakParams if any */
              keycloakParams:
                  | undefined
                  | {
                        url?: string;
                        realm?: string;
                        clientId: string;
                    };
          };
    highlightedPackages: string[];
    evtUserActivity: NonPostableEvt<void>;
    //NOTE: The s3 params are provided by the region.
};

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

    const { evtUserActivity } = params;

    const { oidcClient, jwtClaims } = await (async () => {
        const { userAuthenticationParams } = params;

        switch (userAuthenticationParams.method) {
            case "keycloak": {
                const {
                    keycloakParams: { clientId, realm, url, jwtClaims },
                    transformUrlBeforeRedirectToLogin,
                } = userAuthenticationParams;

                const oidcClient = await createKeycloakOidcClient({
                    clientId,
                    realm,
                    url,
                    transformUrlBeforeRedirectToLogin,
                    evtUserActivity,
                });

                return { oidcClient, jwtClaims };
            }
            case "mock": {
                const { isUserInitiallyLoggedIn, user } = userAuthenticationParams;

                const jwtClaims: Record<keyof User, string> = {
                    "email": "a",
                    "familyName": "b",
                    "firstName": "c",
                    "username": "d",
                    "groups": "e",
                    "locale": "f",
                };

                const oidcClient = createPhonyOidcClient({
                    isUserInitiallyLoggedIn,
                    jwtClaims,
                    user,
                });

                return { jwtClaims, oidcClient };
            }
        }
    })();

    //NOTE: Legacy, will be removed soon
    dOidcClient.resolve(oidcClient);

    const userApiClient = !oidcClient.isUserLoggedIn
        ? createObjectThatThrowsIfAccessed<UserApiClient>({
              "debugMessage": "User is not logged we should't access the useApiClient",
          })
        : createJwtUserApiClient({
              jwtClaims,
              "getOidcAccessToken": () => oidcClient.accessToken,
          });

    let refGetCurrentlySelectedDeployRegionId:
        | Param0<
              typeof createOfficialOnyxiaApiClient
          >["refGetCurrentlySelectedDeployRegionId"]
        | undefined = undefined;

    let refGetCurrentlySelectedProjectId:
        | Param0<typeof createOfficialOnyxiaApiClient>["refGetCurrentlySelectedProjectId"]
        | undefined = undefined;

    const onyxiaApiClient =
        params.onyxiaApiUrl === null
            ? createMockOnyxiaApiClient()
            : createOfficialOnyxiaApiClient({
                  "url": params.onyxiaApiUrl ?? "/api",
                  "getOidcAccessToken": !oidcClient.isUserLoggedIn
                      ? undefined
                      : () => oidcClient.accessToken,
                  "refGetCurrentlySelectedDeployRegionId":
                      (refGetCurrentlySelectedDeployRegionId = {
                          "current": undefined,
                      }),
                  "refGetCurrentlySelectedProjectId": (refGetCurrentlySelectedProjectId =
                      {
                          "current": undefined,
                      }),
              });

    const secretsManagerClient = !oidcClient.isUserLoggedIn
        ? createObjectThatThrowsIfAccessed<SecretsManagerClient>({
              "debugMessage": "User is not logged, we should't access the secret manager",
          })
        : params.vaultParams === undefined
        ? createLocalStorageSecretManagerClient()
        : await createVaultSecretsManagerClient(
              (() => {
                  const { url, engine, role, keycloakParams } = params.vaultParams;

                  return {
                      engine,
                      role,
                      url,
                      "keycloakParamsOrOidcClient": (() => {
                          const fallbackKeycloakParams =
                              params.userAuthenticationParams.method !== "keycloak"
                                  ? undefined
                                  : params.userAuthenticationParams.keycloakParams;

                          const url = keycloakParams?.url ?? fallbackKeycloakParams?.url;
                          const clientId =
                              keycloakParams?.clientId ??
                              fallbackKeycloakParams?.clientId;
                          const realm =
                              keycloakParams?.realm ?? fallbackKeycloakParams?.realm;

                          assert(
                              url !== undefined &&
                                  clientId !== undefined &&
                                  realm !== undefined,
                              "There is no specific keycloak config for Vault and no keycloak config to fallback to",
                          );

                          if (
                              fallbackKeycloakParams !== undefined &&
                              fallbackKeycloakParams.url === url &&
                              fallbackKeycloakParams.realm === realm &&
                              fallbackKeycloakParams.clientId === clientId
                          ) {
                              console.log(
                                  "TODO: Figure out. Hack for Orange. We reuse oidcClient of Onyxia for Vault",
                              );
                              return oidcClient;
                          }

                          return { url, clientId, realm };
                      })(),
                      evtUserActivity,
                  };
              })(),
          );

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

    if (refGetCurrentlySelectedDeployRegionId !== undefined) {
        refGetCurrentlySelectedDeployRegionId.current = () =>
            store.getState().deploymentRegion.selectedDeploymentRegionId;
    }

    if (oidcClient.isUserLoggedIn) {
        const { s3: s3Params } =
            deploymentRegionUseCase.selectors.selectedDeploymentRegion(store.getState());

        extraArgument.s3Client =
            s3Params === undefined
                ? createDummyS3Client()
                : await createS3Client({
                      ...getCreateS3ClientParams({
                          s3Params,
                          "fallbackKeycloakParams":
                              params.userAuthenticationParams.method !== "keycloak"
                                  ? undefined
                                  : params.userAuthenticationParams.keycloakParams,
                      }),
                      "createAwsBucket": onyxiaApiClient.createAwsBucket,
                      evtUserActivity,
                  });
    }

    if (oidcClient.isUserLoggedIn) {
        await store.dispatch(projectSelectionUseCase.privateThunks.initialize());

        if (refGetCurrentlySelectedProjectId !== undefined) {
            refGetCurrentlySelectedProjectId.current = () =>
                store.getState().projectSelection.selectedProjectId;
        }
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
