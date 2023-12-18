/* eslint-disable @typescript-eslint/no-unused-expressions */
import {
    createCore,
    createObjectThatThrowsIfAccessed,
    AccessError,
    type GenericCore
} from "redux-clean-architecture";
import type { OnyxiaApi } from "core/ports/OnyxiaApi";
import type { SqlOlap } from "core/ports/SqlOlap";
import { usecases } from "./usecases";
import type { SecretsManager } from "core/ports/SecretsManager";
import type { Oidc } from "core/ports/Oidc";
import type { S3Client } from "core/ports/S3Client";
import type { Language } from "core/ports/OnyxiaApi/Language";
import type { ParamsOfCreateS3Client } from "core/adapters/s3Client/default";
import { createDuckDbSqlOlap } from "core/adapters/sqlOlap/default";
import { pluginSystemInitCore } from "pluginSystem";
import { assert } from "tsafe/assert";
import { id } from "tsafe/id";
import { onlyIfChanged } from "evt/operators";

type ParamsOfBootstrapCore = {
    /** Empty string for using mock */
    apiUrl: string;
    transformUrlBeforeRedirectToLogin: (url: string) => string;
    getCurrentLang: () => Language;
    disablePersonalInfosInjectionInGroup: boolean;
    isCommandBarEnabledByDefault: boolean;
};

export type Context = {
    paramsOfBootstrapCore: ParamsOfBootstrapCore;
    oidc: Oidc;
    onyxiaApi: OnyxiaApi;
    secretsManager: SecretsManager;
    s3Client: S3Client;
    sqlOlap: SqlOlap;
};

export type Core = GenericCore<typeof usecases, Context>;

export async function bootstrapCore(
    params: ParamsOfBootstrapCore
): Promise<{ core: Core }> {
    const { apiUrl, transformUrlBeforeRedirectToLogin } = params;

    const isSandboxEnvironment = apiUrl === "";

    let isCoreCreated = false;

    let oidc: Oidc | undefined = undefined;

    const onyxiaApi = await (async () => {
        if (isSandboxEnvironment) {
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
            "getCurrentRegionId": () => {
                if (!isCoreCreated) {
                    return undefined;
                }

                try {
                    return usecases.deploymentRegionSelection.selectors.currentDeploymentRegion(
                        getState()
                    ).id;
                } catch (error) {
                    if (error instanceof AccessError) {
                        return undefined;
                    }
                    throw error;
                }
            },
            "getCurrentProjectIdAndGroup": () => {
                if (!isCoreCreated) {
                    return undefined;
                }

                let id: string;
                let group: string | undefined;

                try {
                    const project = usecases.projectSelection.selectors.currentProject(
                        getState()
                    );
                    id = project.id;
                    group = project.group;
                } catch (error) {
                    if (error instanceof AccessError) {
                        return undefined;
                    }
                    throw error;
                }
                return { id, group };
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

    const context: Context = {
        "paramsOfBootstrapCore": params,
        oidc,
        onyxiaApi,
        "secretsManager": createObjectThatThrowsIfAccessed<SecretsManager>({
            "debugMessage": "secretsManager is not yet initialized"
        }),
        "s3Client": createObjectThatThrowsIfAccessed<S3Client>({
            "debugMessage": "s3 client is not yet initialized"
        }),
        "sqlOlap": createDuckDbSqlOlap()
    };

    const { core, dispatch, getState, evtAction } = createCore({
        context,
        usecases
    });

    isCoreCreated = true;

    await dispatch(usecases.userAuthentication.protectedThunks.initialize());

    await dispatch(usecases.deploymentRegionSelection.protectedThunks.initialize());

    if (oidc.isUserLoggedIn) {
        context.secretsManager = await (async () => {
            /* prettier-ignore */
            const deploymentRegion = usecases.deploymentRegionSelection.selectors.currentDeploymentRegion(getState());

            if (deploymentRegion.vault === undefined) {
                /* prettier-ignore */
                const { createSecretManager } = await import("core/adapters/secretManager/mock");

                return createSecretManager();
            }

            const [{ createSecretManager }, { createOidcOrFallback }] = await Promise.all(
                [
                    import("core/adapters/secretManager/default"),
                    import("core/adapters/oidc/utils/createOidcOrFallback")
                ]
            );

            return createSecretManager({
                "kvEngine": deploymentRegion.vault.kvEngine,
                "role": deploymentRegion.vault.role,
                "url": deploymentRegion.vault.url,
                "authPath": deploymentRegion.vault.authPath,
                "oidc": await createOidcOrFallback({
                    "oidcAdapterImplementationToUseIfNotFallingBack": "default",
                    "oidcParams": deploymentRegion.vault.oidcParams,
                    "fallbackOidc": oidcParams === undefined ? undefined : oidc
                })
            });
        })();

        await dispatch(usecases.userConfigs.protectedThunks.initialize());

        await dispatch(usecases.projectSelection.protectedThunks.initialize());

        await dispatch(usecases.projectConfigs.protectedThunks.initialize());

        init_s3_client: {
            if (isSandboxEnvironment) {
                const { s3client } = await import("core/adapters/s3Client/mock");

                context.s3Client = s3client;

                break init_s3_client;
            }

            const [{ createS3Client }, { createOidcOrFallback }] = await Promise.all([
                import("core/adapters/s3Client/default"),
                import("core/adapters/oidc/utils/createOidcOrFallback")
            ]);

            const deploymentRegion =
                usecases.deploymentRegionSelection.selectors.currentDeploymentRegion(
                    getState()
                );

            const oidcForS3 =
                deploymentRegion.s3Params.serverIntegratedWithOidc === undefined
                    ? undefined
                    : await createOidcOrFallback({
                          "oidcAdapterImplementationToUseIfNotFallingBack": "default",
                          "oidcParams":
                              deploymentRegion.s3Params.serverIntegratedWithOidc
                                  .oidcParams,
                          "fallbackOidc": oidcParams === undefined ? undefined : oidc
                      });

            evtAction
                .pipe(
                    data =>
                        data.usecaseName === "projectConfigs" &&
                        (data.actionName === "projectChanged" ||
                            (data.actionName === "updated" &&
                                data.payload.key === "customS3Configs"))
                )
                .toStateful()
                .pipe(() => {
                    const { customS3Configs } =
                        usecases.projectConfigs.selectors.selectedProjectConfigs(
                            getState()
                        );

                    const project = usecases.projectSelection.selectors.currentProject(
                        getState()
                    );

                    return [
                        {
                            customS3Configs,
                            "projectBucketName": project.bucket
                        }
                    ];
                })
                .pipe(onlyIfChanged())
                .attach(({ customS3Configs, projectBucketName }) => {
                    init_with_region_params: {
                        if (customS3Configs.indexForXOnyxia === undefined) {
                            break init_with_region_params;
                        }

                        const {
                            url,
                            region,
                            accessKeyId,
                            secretAccessKey,
                            sessionToken
                        } =
                            customS3Configs.availableConfigs[
                                customS3Configs.indexForXOnyxia
                            ];

                        context.s3Client = createS3Client({
                            "authWith": "provided S3 account credentials",
                            url,
                            region,
                            accessKeyId,
                            secretAccessKey,
                            sessionToken
                        });

                        return;
                    }

                    const deploymentRegion =
                        usecases.deploymentRegionSelection.selectors.currentDeploymentRegion(
                            getState()
                        );

                    if (
                        deploymentRegion.s3Params.serverIntegratedWithOidc === undefined
                    ) {
                        return;
                    }

                    assert(oidcForS3 !== undefined);

                    const common: ParamsOfCreateS3Client.AuthWithVolatileAccount.Common =
                        {
                            "authWith":
                                "volatile S3 Account dynamically created with OIDC",
                            "oidc": oidcForS3,
                            "requestedTokenValidityDurationSeconds":
                                deploymentRegion.s3Params.serverIntegratedWithOidc
                                    .requestedTokenValidityDurationSeconds,
                            "nameOfBucketToCreateIfNotExist": deploymentRegion.s3Params
                                .serverIntegratedWithOidc.doSupportDynamicBucketCreation
                                ? projectBucketName
                                : undefined,
                            "region":
                                deploymentRegion.s3Params.serverIntegratedWithOidc.region,
                            "roleARN":
                                deploymentRegion.s3Params.serverIntegratedWithOidc
                                    .roleARN,
                            "roleSessionName":
                                deploymentRegion.s3Params.serverIntegratedWithOidc
                                    .roleSessionName
                        };

                    const paramsOfCreateS3Client = deploymentRegion.s3Params
                        .serverIntegratedWithOidc.isOnPremise
                        ? id<ParamsOfCreateS3Client.AuthWithVolatileAccount.OnPremise>({
                              ...common,
                              "isOnPremise": true,
                              "url": deploymentRegion.s3Params.serverIntegratedWithOidc
                                  .url
                          })
                        : (() => {
                              switch (
                                  deploymentRegion.s3Params.serverIntegratedWithOidc
                                      .cloudProvider
                              ) {
                                  case "Amazon web services":
                                      return id<ParamsOfCreateS3Client.AuthWithVolatileAccount.CloudProvider.AmazonWebServices>(
                                          {
                                              ...common,
                                              "isOnPremise": false,
                                              "cloudProvider": "Amazon web services",
                                              "region":
                                                  deploymentRegion.s3Params
                                                      .serverIntegratedWithOidc.region,
                                              "roleARN":
                                                  deploymentRegion.s3Params
                                                      .serverIntegratedWithOidc.roleARN,
                                              "roleSessionName":
                                                  deploymentRegion.s3Params
                                                      .serverIntegratedWithOidc
                                                      .roleSessionName,
                                              "createAwsBucket":
                                                  context.onyxiaApi.createAwsBucket
                                          }
                                      );
                              }
                          })();

                    context.s3Client = createS3Client(paramsOfCreateS3Client);
                });
        }

        await dispatch(usecases.restorableConfigManager.protectedThunks.initialize());

        await dispatch(usecases.userAccountManagement.protectedThunks.initialize());
    }

    pluginSystemInitCore({ core, context });

    return { core };
}

export type State = Core["types"]["State"];

export type Thunks = Core["types"]["Thunks"];

export type CreateEvt = Core["types"]["CreateEvt"];
