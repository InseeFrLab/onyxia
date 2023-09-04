import {
    createCoreFromUsecases,
    createObjectThatThrowsIfAccessed,
    AccessError,
    type GenericCreateEvt,
    type GenericThunks
} from "redux-clean-architecture";
import { usecases } from "./usecases";
import type { SecretsManager } from "./ports/SecretsManager";
import type { S3Client } from "./ports/S3Client";
import type { ReturnType } from "tsafe/ReturnType";
import type { Language } from "./ports/OnyxiaApi";

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
    disablePersonalInfosInjectionInGroup: boolean;
};

export async function createCore(params: CoreParams) {
    const {
        apiUrl,
        isUserInitiallyLoggedIn = false,
        transformUrlBeforeRedirectToLogin,
        getCurrentLang,
        keycloakParams
    } = params;

    const oidc = await (async () => {
        if (keycloakParams === undefined) {
            const { createOidc } = await import("core/adapters/oidcMock");

            return createOidc({ isUserInitiallyLoggedIn });
        }

        const { createOidc } = await import("core/adapters/oidc");

        return createOidc({
            ...keycloakParams,
            "transformUrlBeforeRedirect": transformUrlBeforeRedirectToLogin,
            "getUiLocales": getCurrentLang
        });
    })();

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
            "getRegionId": () => {
                try {
                    return usecases.deploymentRegion.selectors.selectedDeploymentRegion(
                        core.getState()
                    ).id;
                } catch (error) {
                    if (error instanceof AccessError) {
                        return undefined;
                    }
                    throw error;
                }
            },
            "getProject": () => {
                try {
                    return usecases.projectConfigs.selectors.selectedProject(
                        core.getState()
                    );
                } catch (error) {
                    if (error instanceof AccessError) {
                        return undefined;
                    }
                    throw error;
                }
            }
        });

        return sillApi;
    })();

    const thunksExtraArgument = {
        "coreParams": params,
        oidc,
        onyxiaApi,
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

    await core.dispatch(usecases.userAuthentication.protectedThunks.initialize());

    await core.dispatch(usecases.deploymentRegion.protectedThunks.initialize());

    if (oidc.isUserLoggedIn) {
        /* prettier-ignore */
        const { s3: s3Params, vault: vaultParams } = usecases.deploymentRegion.selectors.selectedDeploymentRegion(core.getState());

        /* prettier-ignore */
        const fallbackOidc = keycloakParams === undefined ? undefined : {
            "keycloakParams": keycloakParams,
            "oidc": oidc
        };

        /* prettier-ignore */
        const { createOidcOrFallback } = await import("core/adapters/oidc/createOidcOrFallback");

        thunksExtraArgument.s3Client = await (async () => {
            if (s3Params === undefined) {
                const { s3client } = await import("core/adapters/s3ClientMock");

                return s3client;
            }

            /** prettier-ignore */
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
                /* prettier-ignore */
                const { createSecretManager } = await import("core/adapters/secretsManagerMock");

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

        await core.dispatch(usecases.userConfigs.protectedThunks.initialize());

        await core.dispatch(usecases.projectConfigs.protectedThunks.initialize());

        /** prettier-ignore */
        await core.dispatch(
            usecases.restorablePackageConfigs.protectedThunks.initialize()
        );
    }

    core.dispatch(usecases.runningService.protectedThunks.initialize());

    return core;
}

export type Core = ReturnType<typeof createCore>;

export type State = ReturnType<Core["getState"]>;

export type ThunksExtraArgument = Core["thunksExtraArgument"];

export type Thunks = GenericThunks<Core>;

export type CreateEvt = GenericCreateEvt<Core>;
