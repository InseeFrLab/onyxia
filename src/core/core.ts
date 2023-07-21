import {
    createCoreFromUsecases,
    createObjectThatThrowsIfAccessed
} from "redux-clean-architecture";
import type { GenericCreateEvt, GenericThunks } from "redux-clean-architecture";
import { createGetUser } from "./adapters/getUser";
import { usecases } from "./usecases";
import type { GetUser, User } from "./ports/GetUser";
import type { SecretsManager } from "./ports/SecretsManager";
import type { S3Client } from "./ports/S3Client";
import type { ReturnType } from "tsafe/ReturnType";
import type { Language } from "./ports/OnyxiaApi";
import { id } from "tsafe/id";

type CoreParams = {
    /** Empty string for using mock */
    apiUrl: string;
    /** Default: false, only considered if using mocks */
    isUserInitiallyLoggedIn?: boolean;
    transformUrlBeforeRedirectToLogin: (url: string) => string;
    getCurrentLang: () => Language;
    keycloakParams:
        | {
              url: string;
              realm: string;
              clientId: string;
          }
        | undefined;
    jwtClaimByUserKey: Record<keyof User, string>;
};

export async function createCore(params: CoreParams) {
    const {
        apiUrl,
        isUserInitiallyLoggedIn = false,
        transformUrlBeforeRedirectToLogin,
        getCurrentLang,
        keycloakParams,
        jwtClaimByUserKey
    } = params;

    const oidc = await (async () => {
        if (keycloakParams === undefined) {
            const { createOidc } = await import("core/adapters/oidcMock");

            return createOidc({
                isUserInitiallyLoggedIn,
                jwtClaimByUserKey,
                "user": {
                    "username": "doej",
                    "email": "john.doe@insee.fr",
                    "familyName": "Doe",
                    "firstName": "John"
                }
            });
        }

        const { createOidc } = await import("core/adapters/oidc");

        return createOidc({
            ...keycloakParams,
            "transformUrlBeforeRedirect": transformUrlBeforeRedirectToLogin,
            "getUiLocales": getCurrentLang
        });
    })();

    /* prettier-ignore */
    const refGetCurrentlySelectedDeployRegionId = { "current": id<undefined | (() => string)>(undefined) };
    /* prettier-ignore */
    const refGetCurrentlySelectedProjectId = { "current": id<undefined | (() => string)>(undefined) };

    const onyxiaApi = await (async () => {
        if (apiUrl === "") {
            const { onyxiaApi } = await import("core/adapters/onyxiaApiMock");

            return onyxiaApi;
        }

        const { createOnyxiaApi } = await import("core/adapters/onyxiaApi");

        const sillApi = createOnyxiaApi({
            "url": apiUrl,
            "getOidcAccessToken": () => {
                if (!oidc.isUserLoggedIn) {
                    return undefined;
                }
                return oidc.getAccessToken().accessToken;
            },
            refGetCurrentlySelectedDeployRegionId,
            refGetCurrentlySelectedProjectId
        });

        return sillApi;
    })();

    const getUser = (() => {
        if (!oidc.isUserLoggedIn) {
            return createObjectThatThrowsIfAccessed<GetUser>();
        }

        const { getUser } = createGetUser({
            jwtClaimByUserKey,
            "getOidcAccessToken": () => oidc.getAccessToken().accessToken
        });

        return getUser;
    })();

    const thunksExtraArgument = {
        "createStoreParams": params,
        oidc,
        onyxiaApi,
        getUser,
        /** prettier-ignore */
        "secretsManager": createObjectThatThrowsIfAccessed<SecretsManager>({
            "debugMessage": "secretsManager is not yet initialized"
        }),
        /** prettier-ignore */
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

    /** prettier-ignore */
    refGetCurrentlySelectedDeployRegionId.current = () =>
        core.getState().deploymentRegion.selectedDeploymentRegionId;

    if (oidc.isUserLoggedIn) {
        /* prettier-ignore */
        const { s3: s3Params, vault: vaultParams } = usecases.deploymentRegion.selectors.selectedDeploymentRegion(core.getState());

        /* prettier-ignore */
        const fallbackOidc = keycloakParams === undefined ? undefined : {
            "keycloakParams": keycloakParams,
            "oidc": oidc
        };

        const { createOidcOrFallback } = await import(
            "core/adapters/oidc/createOidcOrFallback"
        );

        thunksExtraArgument.s3Client = await (async () => {
            if (s3Params === undefined) {
                const { s3client } = await import("core/adapters/s3ClientMock");

                return s3client;
            }

            const { createS3Client, getCreateS3ClientParams } = await import(
                "core/adapters/s3client"
            );

            return createS3Client({
                "oidc": await createOidcOrFallback({
                    "keycloakParams": s3Params.keycloakParams,
                    "fallback": fallbackOidc
                }),
                ...getCreateS3ClientParams({ s3Params }),
                "createAwsBucket": onyxiaApi.createAwsBucket
            });
        })();

        thunksExtraArgument.secretsManager = await (async () => {
            if (vaultParams === undefined) {
                const { createSecretManager } = await import(
                    "core/adapters/secretsManagerMock"
                );

                return createSecretManager();
            }

            const { createSecretManager } = await import("core/adapters/secretsManager");

            return createSecretManager({
                "kvEngine": vaultParams.kvEngine,
                "role": vaultParams.role,
                "url": vaultParams.url,
                "authPath": vaultParams.authPath,
                "oidc": await createOidcOrFallback({
                    "keycloakParams": vaultParams.keycloakParams,
                    "fallback": fallbackOidc
                })
            });
        })();

        await core.dispatch(usecases.userConfigs.privateThunks.initialize());

        await core.dispatch(usecases.projectSelection.privateThunks.initialize());

        console.log("after");

        /* prettier-ignore */
        refGetCurrentlySelectedProjectId.current = () => core.getState().projectSelection.selectedProjectId;

        core.dispatch(usecases.restorablePackageConfigs.privateThunks.initialize());
    }

    core.dispatch(usecases.runningService.privateThunks.initialize());

    return core;
}

export type Core = ReturnType<typeof createCore>;

export type State = ReturnType<Core["getState"]>;

export type ThunksExtraArgument = Core["thunksExtraArgument"];

export type Thunks = GenericThunks<Core>;

export type CreateEvt = GenericCreateEvt<Core>;
