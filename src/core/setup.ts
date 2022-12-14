/* eslint-disable react-hooks/rules-of-hooks */
import type { Action, ThunkAction as ReduxGenericThunkAction } from "@reduxjs/toolkit";
import {
    createCoreFromUsecases,
    createObjectThatThrowsIfAccessed
} from "redux-clean-architecture";
import type { GenericCreateEvt, GenericThunks } from "redux-clean-architecture";
import { createLocalStorageSecretManagerClient } from "./adapters/localStorageSecretsManagerClient";
import { createVaultSecretsManagerClient } from "./adapters/vaultSecretsManagerClient";
import { createJwtUserApiClient } from "./adapters/jwtUserApiClient";
import { createS3Client, getCreateS3ClientParams } from "./adapters/s3Client";
import { createDummyS3Client } from "./adapters/dummyS3Client";
import { usecases } from "./usecases";
import type { UserApiClient } from "./ports/UserApiClient";
import type { SecretsManagerClient } from "./ports/SecretsManagerClient";
import type { S3Client } from "./ports/S3Client";
import type { ReturnType } from "tsafe/ReturnType";
import { Deferred } from "evt/tools/Deferred";
import {
    createKeycloakOidcClient,
    creatOrFallbackOidcClient
} from "./adapters/keycloakOidcClient";
import { createPhonyOidcClient } from "./adapters/phonyOidcClient";
import type { OidcClient } from "./ports/OidcClient";
import { createMockOnyxiaApiClient } from "./adapters/mockOnyxiaApiClient";
import { createOfficialOnyxiaApiClient } from "./adapters/officialOnyxiaApiClient";
import type { User } from "./ports/UserApiClient";
import type { Param0 } from "tsafe";
import type { NonPostableEvt } from "evt";

type CoreParams = {
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
    evtUserActivity: NonPostableEvt<void>;
    //NOTE: The s3 params are provided by the region.
};

export async function createCore(params: CoreParams) {
    const { evtUserActivity } = params;

    const { oidcClient, jwtClaims } = await (async () => {
        const { userAuthenticationParams } = params;

        switch (userAuthenticationParams.method) {
            case "keycloak": {
                const {
                    keycloakParams: { clientId, realm, url, jwtClaims },
                    transformUrlBeforeRedirectToLogin
                } = userAuthenticationParams;

                const oidcClient = await createKeycloakOidcClient({
                    clientId,
                    realm,
                    url,
                    transformUrlBeforeRedirectToLogin,
                    evtUserActivity
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
                    "groups": "e"
                };

                const oidcClient = createPhonyOidcClient({
                    isUserInitiallyLoggedIn,
                    jwtClaims,
                    user
                });

                return { jwtClaims, oidcClient };
            }
        }
    })();

    //NOTE: Legacy, will be removed soon
    dOidcClient.resolve(oidcClient);

    const userApiClient = !oidcClient.isUserLoggedIn
        ? createObjectThatThrowsIfAccessed<UserApiClient>({
              "debugMessage": "User is not logged we should't access the useApiClient"
          })
        : createJwtUserApiClient({
              jwtClaims,
              "getOidcAccessToken": () => oidcClient.getAccessToken().accessToken
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
                      : () => oidcClient.getAccessToken().accessToken,
                  "refGetCurrentlySelectedDeployRegionId":
                      (refGetCurrentlySelectedDeployRegionId = {
                          "current": undefined
                      }),
                  "refGetCurrentlySelectedProjectId": (refGetCurrentlySelectedProjectId =
                      {
                          "current": undefined
                      })
              });

    const thunksExtraArgument = {
        "createStoreParams": params,
        oidcClient,
        onyxiaApiClient,
        userApiClient,
        "secretsManagerClient": createObjectThatThrowsIfAccessed<SecretsManagerClient>({
            "debugMessage": "secretsManagerClient is not yet initialized"
        }),
        "s3Client": createObjectThatThrowsIfAccessed<S3Client>({
            "debugMessage": "s3 client is not yet initialized"
        })
    };

    const core = createCoreFromUsecases({
        thunksExtraArgument,
        usecases
    });

    await core.dispatch(usecases.userAuthentication.privateThunks.initialize());

    await core.dispatch(usecases.deploymentRegion.privateThunks.initialize());

    if (refGetCurrentlySelectedDeployRegionId !== undefined) {
        refGetCurrentlySelectedDeployRegionId.current = () =>
            core.getState().deploymentRegion.selectedDeploymentRegionId;
    }

    if (oidcClient.isUserLoggedIn) {
        const { s3: s3Params, vault: vaultParams } =
            usecases.deploymentRegion.selectors.selectedDeploymentRegion(core.getState());

        const fallbackOidc =
            params.userAuthenticationParams.method !== "keycloak"
                ? undefined
                : {
                      "keycloakParams": params.userAuthenticationParams.keycloakParams,
                      "oidcClient": oidcClient
                  };

        thunksExtraArgument.s3Client =
            s3Params === undefined
                ? createDummyS3Client()
                : await createS3Client({
                      "oidcClient": await creatOrFallbackOidcClient({
                          "keycloakParams": s3Params.keycloakParams,
                          "fallback": fallbackOidc,
                          evtUserActivity
                      }),
                      ...getCreateS3ClientParams({ s3Params }),
                      "createAwsBucket": onyxiaApiClient.createAwsBucket
                  });

        thunksExtraArgument.secretsManagerClient =
            vaultParams === undefined
                ? createLocalStorageSecretManagerClient()
                : await createVaultSecretsManagerClient({
                      "kvEngine": vaultParams.kvEngine,
                      "role": vaultParams.role,
                      "url": vaultParams.url,
                      "oidcClient": await creatOrFallbackOidcClient({
                          "keycloakParams": vaultParams.keycloakParams,
                          "fallback": fallbackOidc,
                          evtUserActivity
                      })
                  });

        await core.dispatch(usecases.userConfigs.privateThunks.initialize());

        await core.dispatch(usecases.projectSelection.privateThunks.initialize());

        if (refGetCurrentlySelectedProjectId !== undefined) {
            refGetCurrentlySelectedProjectId.current = () =>
                core.getState().projectSelection.selectedProjectId;
        }

        core.dispatch(usecases.restorablePackageConfigs.privateThunks.initialize());
    }

    core.dispatch(usecases.runningService.privateThunks.initialize());

    return core;
}

export type Core = ReturnType<typeof createCore>;

export type State = ReturnType<Core["getState"]>;

export type ThunksExtraArgument = Core["thunksExtraArgument"];

/** @deprecated: Use Thunks as soon as we cas use 'satisfy' from TS 4.9 */
export type ThunkAction<RtnType = Promise<void>> = ReduxGenericThunkAction<
    RtnType,
    State,
    ThunksExtraArgument,
    Action<string>
>;

export type Thunks = GenericThunks<Core>;

export type CreateEvt = GenericCreateEvt<Core>;

const dOidcClient = new Deferred<OidcClient>();
