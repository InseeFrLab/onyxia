/* eslint-disable @typescript-eslint/no-unused-expressions */
import {
    createCoreFromUsecases,
    createObjectThatThrowsIfAccessed,
    AccessError,
    type GenericCreateEvt,
    type GenericThunks
} from "redux-clean-architecture";
import { usecases } from "./usecases";
import type { SecretsManager } from "core/ports/SecretsManager";
import type { Oidc } from "core/ports/Oidc";
import type { S3Client } from "core/ports/S3Client";
import type { ReturnType } from "tsafe/ReturnType";
import type { Language } from "core/ports/OnyxiaApi/Language";

type CoreParams = {
    /** Empty string for using mock */
    apiUrl: string;
    transformUrlBeforeRedirectToLogin: (url: string) => string;
    getCurrentLang: () => Language;
    disablePersonalInfosInjectionInGroup: boolean;
    isCommandBarEnabledByDefault: boolean;
};

export async function createCore(params: CoreParams) {
    const { apiUrl, transformUrlBeforeRedirectToLogin } = params;

    let isCoreCreated = false;

    let oidc: Oidc | undefined = undefined;

    const onyxiaApi = await (async () => {
        if (apiUrl === "") {
            const { onyxiaApi } = await import("core/adapters/onyxiaApi/mock");

            return onyxiaApi;
        }

        const { createOnyxiaApi } = await import("core/adapters/onyxiaApi/default");

        const onyxiaApi = createOnyxiaApi({
            "url": apiUrl,
            "getOidcAccessToken": () => {
                if (oidc === undefined) {
                    return undefined;
                }

                if (!oidc.isUserLoggedIn) {
                    return undefined;
                }
                return oidc.getTokens().accessToken;
            },
            "getRegionId": () => {
                if (!isCoreCreated) {
                    return undefined;
                }

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
                if (!isCoreCreated) {
                    return undefined;
                }

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

        return onyxiaApi;
    })();

    let oidcParams: { issuerUri: string; clientId: string } | undefined = undefined;

    oidc = await (async () => {
        oidcParams = (await onyxiaApi.getAvailableRegionsAndOidcParams()).oidcParams;

        if (oidcParams === undefined) {
            const { createOidc } = await import("core/adapters/oidc/mock");

            return createOidc({ "isUserInitiallyLoggedIn": false });
        }

        const { createOidc } = await import("core/adapters/oidc/default");

        return createOidc({
            "issuerUri": oidcParams.issuerUri,
            "clientId": oidcParams.clientId,
            "transformUrlBeforeRedirect": transformUrlBeforeRedirectToLogin
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

    isCoreCreated = true;

    await core.dispatch(usecases.userAuthentication.protectedThunks.initialize());

    await core.dispatch(usecases.deploymentRegion.protectedThunks.initialize());

    if (oidc.isUserLoggedIn) {
        /* prettier-ignore */
        const { s3: s3Params, vault: vaultParams } = usecases.deploymentRegion.selectors.selectedDeploymentRegion(core.getState());

        /* prettier-ignore */
        const nonMockOidc = oidcParams === undefined ? undefined : oidc;

        /* prettier-ignore */
        const { createOidcOrFallback } = await import("core/adapters/oidc/utils/createOidcOrFallback");

        thunksExtraArgument.s3Client = await (async () => {
            if (s3Params === undefined) {
                const { s3client } = await import("core/adapters/s3Client/mock");

                return s3client;
            }

            /** prettier-ignore */
            const { createS3Client, getCreateS3ClientParams } = await import(
                "core/adapters/s3Client/default"
            );

            return createS3Client({
                ...getCreateS3ClientParams({ s3Params }),
                "createAwsBucket": onyxiaApi.createAwsBucket,
                "oidc": await createOidcOrFallback({
                    "oidcAdapterImplementationToUseIfNotFallingBack": "default",
                    "oidcParams": s3Params.oidcParams,
                    "fallbackOidc": nonMockOidc
                })
            });
        })();

        thunksExtraArgument.secretsManager = await (async () => {
            if (vaultParams === undefined) {
                /* prettier-ignore */
                const { createSecretManager } = await import("core/adapters/secretManager/mock");

                return createSecretManager();
            }

            const { createSecretManager } = await import(
                "core/adapters/secretManager/default"
            );

            return createSecretManager({
                "kvEngine": vaultParams.kvEngine,
                "role": vaultParams.role,
                "url": vaultParams.url,
                "authPath": vaultParams.authPath,
                "oidc": await createOidcOrFallback({
                    "oidcAdapterImplementationToUseIfNotFallingBack": "default",
                    "oidcParams": vaultParams.oidcParams,
                    "fallbackOidc": nonMockOidc
                })
            });
        })();

        await core.dispatch(usecases.userConfigs.protectedThunks.initialize());

        await core.dispatch(usecases.projectConfigs.protectedThunks.initialize());

        /** prettier-ignore */
        await core.dispatch(
            usecases.restorableConfigManager.protectedThunks.initialize()
        );

        await core.dispatch(usecases.userAccountManagement.protectedThunks.initialize());
    }

    return core;
}

export type Core = ReturnType<typeof createCore>;

export type State = ReturnType<Core["getState"]>;

export type ThunksExtraArgument = Core["thunksExtraArgument"];

export type Thunks = GenericThunks<Core>;

export type CreateEvt = GenericCreateEvt<Core>;
