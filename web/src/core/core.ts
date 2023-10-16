/* eslint-disable @typescript-eslint/no-unused-expressions */
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
import type { Language } from "./ports/OnyxiaApi/Language";

type CoreParams = {
    /** Empty string for using mock */
    apiUrl: string;
    transformUrlBeforeRedirectToLogin: (url: string) => string;
    getCurrentLang: () => Language;
    disablePersonalInfosInjectionInGroup: boolean;
    isCommandBarEnabledByDefault: boolean;
};

export async function createCore(params: CoreParams) {
    const { apiUrl, transformUrlBeforeRedirectToLogin, getCurrentLang } = params;

    const onyxiaApi = await (async () => {
        if (apiUrl === "") {
            const { onyxiaApi } = await import("core/adapters/onyxiaApiMock");

            return onyxiaApi;
        }

        const { createOnyxiaApi } = await import("core/adapters/onyxiaApi");

        const onyxiaApi = createOnyxiaApi({
            "url": apiUrl,
            "getOidcAccessToken": () => {
                try {
                    oidc;
                } catch {
                    // We haven't initialized oidc yet
                    return undefined;
                }

                if (!oidc.isUserLoggedIn) {
                    return undefined;
                }
                return oidc.getAccessToken().accessToken;
            },
            "getRegionId": () => {
                try {
                    core;
                } catch {
                    // We haven't initialized the core yet
                    return undefined;
                }

                const state = core.getState();

                try {
                    return usecases.deploymentRegion.selectors.selectedDeploymentRegion(
                        state
                    ).id;
                } catch (error) {
                    if (error instanceof AccessError) {
                        // We haven't initialized the deployment region yet
                        return undefined;
                    }
                    throw error;
                }
            },
            "getProject": () => {
                try {
                    core;
                } catch {
                    // We haven't initialized the core yet
                    return undefined;
                }

                const state = core.getState();

                try {
                    return usecases.projectConfigs.selectors.selectedProject(state);
                } catch (error) {
                    if (error instanceof AccessError) {
                        // We haven't initialized the projectConfigs yet
                        return undefined;
                    }
                    throw error;
                }
            }
        });

        return onyxiaApi;
    })();

    let oidcParams: { authority: string; clientId: string } | undefined = undefined;

    const oidc = await (async () => {
        oidcParams = (await onyxiaApi.getAvailableRegionsAndOidcParams()).oidcParams;

        if (oidcParams === undefined) {
            const { createOidc } = await import("core/adapters/oidcMock");

            return createOidc({ "isUserInitiallyLoggedIn": false });
        }

        const { createOidc } = await import("core/adapters/oidc");

        return createOidc({
            "authority": oidcParams.authority,
            "clientId": oidcParams.clientId,
            "transformUrlBeforeRedirect": transformUrlBeforeRedirectToLogin,
            "getUiLocales": getCurrentLang
        });
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
        const fallback = oidcParams === undefined ? undefined : {
            oidcParams,
            oidc
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
                ...getCreateS3ClientParams({ s3Params }),
                "createAwsBucket": onyxiaApi.createAwsBucket,
                "oidc": await createOidcOrFallback({
                    "oidcParams": s3Params.oidcParams,
                    fallback
                })
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
                    "oidcParams": vaultParams.oidcParams,
                    fallback
                })
            });
        })();

        await core.dispatch(usecases.userConfigs.protectedThunks.initialize());

        await core.dispatch(usecases.projectConfigs.protectedThunks.initialize());

        /** prettier-ignore */
        await core.dispatch(usecases.restorableConfigs.protectedThunks.initialize());

        await core.dispatch(usecases.userAccountManagement.protectedThunks.initialize());
    }

    return core;
}

export type Core = ReturnType<typeof createCore>;

export type State = ReturnType<Core["getState"]>;

export type ThunksExtraArgument = Core["thunksExtraArgument"];

export type Thunks = GenericThunks<Core>;

export type CreateEvt = GenericCreateEvt<Core>;
