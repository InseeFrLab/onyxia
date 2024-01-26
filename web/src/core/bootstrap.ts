/* eslint-disable @typescript-eslint/no-unused-expressions */
import {
    createCore,
    createObjectThatThrowsIfAccessed,
    AccessError,
    type GenericCore
} from "clean-architecture";
import type { OnyxiaApi } from "core/ports/OnyxiaApi";
import type { SqlOlap } from "core/ports/SqlOlap";
import { usecases } from "./usecases";
import type { SecretsManager } from "core/ports/SecretsManager";
import type { Oidc } from "core/ports/Oidc";
import type { S3Client } from "core/ports/S3Client";
import type { Language } from "core/ports/OnyxiaApi/Language";
import { createDuckDbSqlOlap } from "core/adapters/sqlOlap/default";
import { pluginSystemInitCore } from "pluginSystem";
import { assert, type Equals } from "tsafe/assert";
import { onlyIfChanged } from "evt/operators";
import type { ParamsOfCreateS3Client } from "core/adapters/s3Client/default";
import { id } from "tsafe/id";

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
    s3ClientSts: S3Client | undefined;
    s3ClientForExplorer: S3Client;
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

        return createOnyxiaApi({
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
                    return usecases.deploymentRegionManagement.selectors.currentDeploymentRegion(
                        getState()
                    ).id;
                } catch (error) {
                    if (error instanceof AccessError) {
                        return undefined;
                    }
                    throw error;
                }
            },
            "getCurrentProjectId": () => {
                if (!isCoreCreated) {
                    return undefined;
                }

                try {
                    return usecases.projectManagement.selectors.currentProject(getState())
                        .id;
                } catch (error) {
                    if (error instanceof AccessError) {
                        return undefined;
                    }
                    throw error;
                }
            }
        });
    })();

    oidc = await (async () => {
        const { oidcParams } = await onyxiaApi.getAvailableRegionsAndOidcParams();

        if (oidcParams === undefined) {
            const { createOidc } = await import("core/adapters/oidc/mock");

            return createOidc({ "isUserInitiallyLoggedIn": true });
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
        "secretsManager": createObjectThatThrowsIfAccessed<SecretsManager>(),
        "s3ClientSts": undefined,
        "s3ClientForExplorer": createObjectThatThrowsIfAccessed<S3Client>(),
        "sqlOlap": createDuckDbSqlOlap({
            "getS3Config": async () => {
                const { s3ClientForExplorer } = context;

                const { accessKeyId, secretAccessKey, sessionToken } =
                    await s3ClientForExplorer.getToken({
                        "doForceRenew": false
                    });

                return {
                    "s3_endpoint": s3ClientForExplorer.url,
                    "s3_access_key_id": accessKeyId,
                    "s3_secret_access_key": secretAccessKey,
                    "s3_session_token": sessionToken,
                    "s3_url_style": s3ClientForExplorer.pathStyleAccess ? "path" : "vhost"
                };
            }
        })
    };

    const { core, dispatch, getState, evtAction } = createCore({
        context,
        usecases
    });

    isCoreCreated = true;

    await dispatch(usecases.userAuthentication.protectedThunks.initialize());

    await dispatch(usecases.deploymentRegionManagement.protectedThunks.initialize());

    init_secrets_manager: {
        if (!oidc.isUserLoggedIn) {
            break init_secrets_manager;
        }

        const deploymentRegion =
            usecases.deploymentRegionManagement.selectors.currentDeploymentRegion(
                getState()
            );

        if (deploymentRegion.vault === undefined) {
            const { createSecretManager } = await import(
                "core/adapters/secretManager/mock"
            );

            context.secretsManager = createSecretManager();
            break init_secrets_manager;
        }

        const [{ createSecretManager }, { createOidcOrFallback }] = await Promise.all([
            import("core/adapters/secretManager/default"),
            import("core/adapters/oidc/utils/createOidcOrFallback")
        ]);

        context.secretsManager = await createSecretManager({
            "kvEngine": deploymentRegion.vault.kvEngine,
            "role": deploymentRegion.vault.role,
            "url": deploymentRegion.vault.url,
            "authPath": deploymentRegion.vault.authPath,
            "oidc": await createOidcOrFallback({
                "oidcAdapterImplementationToUseIfNotFallingBack": "default",
                "oidcParams": deploymentRegion.vault.oidcParams,
                "fallbackOidc": oidc
            })
        });
    }

    if (oidc.isUserLoggedIn) {
        await dispatch(usecases.userConfigs.protectedThunks.initialize());
    }

    if (oidc.isUserLoggedIn) {
        await dispatch(usecases.projectManagement.protectedThunks.initialize());
    }

    init_s3_clients: {
        if (!oidc.isUserLoggedIn) {
            break init_s3_clients;
        }

        if (isSandboxEnvironment) {
            const { s3client } = await import("core/adapters/s3Client/mock");

            context.s3ClientForExplorer = s3client;
            context.s3ClientSts = undefined;

            break init_s3_clients;
        }

        const [{ createS3Client }, { createOidcOrFallback }] = await Promise.all([
            import("core/adapters/s3Client/default"),
            import("core/adapters/oidc/utils/createOidcOrFallback")
        ]);

        init_s3_client_sts: {
            const { s3: deploymentRegionS3 } =
                usecases.deploymentRegionManagement.selectors.currentDeploymentRegion(
                    getState()
                );

            if (deploymentRegionS3?.sts === undefined) {
                break init_s3_client_sts;
            }

            const oidcForS3 = await createOidcOrFallback({
                "oidcAdapterImplementationToUseIfNotFallingBack": "default",
                "oidcParams": deploymentRegionS3.sts.oidcParams,
                "fallbackOidc": oidc
            });

            const deploymentRegionS3Sts = deploymentRegionS3.sts;

            evtAction
                .pipe(
                    data =>
                        data.usecaseName === "projectManagement" &&
                        data.actionName === "projectChanged"
                )
                .toStateful()
                .attach(() => {
                    context.s3ClientSts = createS3Client(
                        id<ParamsOfCreateS3Client.Sts>({
                            "url": deploymentRegionS3.url,
                            "isStsEnabled": true,
                            "stsUrl": deploymentRegionS3Sts.url,
                            "pathStyleAccess": deploymentRegionS3.pathStyleAccess,
                            "region": deploymentRegionS3.region,
                            "oidc": oidcForS3,
                            "durationSeconds": deploymentRegionS3Sts.durationSeconds,
                            "role": deploymentRegionS3Sts.role,
                            "nameOfBucketToCreateIfNotExist": (() => {
                                const { workingDirectory } = deploymentRegionS3;

                                if (workingDirectory.bucketMode === "shared") {
                                    return undefined;
                                }

                                assert<
                                    Equals<typeof workingDirectory.bucketMode, "multi">
                                >();

                                const project =
                                    usecases.projectManagement.selectors.currentProject(
                                        getState()
                                    );

                                const { username } =
                                    usecases.userAuthentication.selectors.user(
                                        getState()
                                    );

                                return project.group === undefined
                                    ? `${workingDirectory.bucketNamePrefix}${username}`
                                    : `${workingDirectory.bucketNamePrefixGroup}${project.group}`;
                            })(),
                            "persistance": {
                                "get": () =>
                                    Promise.resolve(
                                        usecases.projectManagement.protectedSelectors.currentProjectConfigs(
                                            getState()
                                        ).s3StsToken
                                    ),
                                "set": ({ token, ttl }) =>
                                    dispatch(
                                        usecases.projectManagement.protectedThunks.updateConfigValue(
                                            {
                                                "key": "s3StsToken",
                                                "value": { token, ttl }
                                            }
                                        )
                                    )
                            }
                        })
                    );
                });
        }

        // Init s3ClientForExplorer
        evtAction
            .pipe(
                data =>
                    data.usecaseName === "projectManagement" &&
                    (data.actionName === "projectChanged" ||
                        (data.actionName === "configValueUpdated" &&
                            data.payload.key === "s3"))
            )
            .toStateful()
            .pipe((): [ParamsOfCreateS3Client.NoSts | undefined] => {
                const { indexForExplorer, customConfigs } =
                    usecases.s3ConfigManagement.protectedSelectors.projectS3Config(
                        getState()
                    );

                if (indexForExplorer === undefined) {
                    return [undefined];
                }

                const customS3ConfigForExplorer = customConfigs[indexForExplorer];

                return [
                    id<ParamsOfCreateS3Client.NoSts>({
                        "isStsEnabled": false,
                        "url": customS3ConfigForExplorer.url,
                        "pathStyleAccess": customS3ConfigForExplorer.pathStyleAccess,
                        "region": customS3ConfigForExplorer.region,
                        "accessKeyId": customS3ConfigForExplorer.accessKeyId,
                        "secretAccessKey": customS3ConfigForExplorer.secretAccessKey,
                        "sessionToken": customS3ConfigForExplorer.sessionToken
                    })
                ];
            })
            .pipe(onlyIfChanged())
            .attach(
                paramsOfCreateS3Client =>
                    (context.s3ClientForExplorer =
                        paramsOfCreateS3Client === undefined
                            ? context.s3ClientSts ??
                              createObjectThatThrowsIfAccessed<S3Client>()
                            : createS3Client(paramsOfCreateS3Client))
            );
    }

    if (oidc.isUserLoggedIn) {
        dispatch(usecases.s3ConfigManagement.protectedThunks.initialize());
    }

    if (oidc.isUserLoggedIn) {
        dispatch(usecases.restorableConfigManagement.protectedThunks.initialize());
    }

    if (oidc.isUserLoggedIn) {
        dispatch(usecases.fileExplorer.protectedThunks.initialize());
    }

    pluginSystemInitCore({ core, context });

    return { core };
}

export type State = Core["types"]["State"];

export type Thunks = Core["types"]["Thunks"];

export type CreateEvt = Core["types"]["CreateEvt"];
