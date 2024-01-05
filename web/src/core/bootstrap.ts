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
        "secretsManager": createObjectThatThrowsIfAccessed<SecretsManager>(),
        "s3Client": createObjectThatThrowsIfAccessed<S3Client>(),
        "sqlOlap": createDuckDbSqlOlap()
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

    init_s3_client: {
        if (!oidc.isUserLoggedIn) {
            break init_s3_client;
        }

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
            usecases.deploymentRegionManagement.selectors.currentDeploymentRegion(
                getState()
            );

        const oidcForS3 =
            deploymentRegion.s3?.sts === undefined
                ? undefined
                : await createOidcOrFallback({
                      "oidcAdapterImplementationToUseIfNotFallingBack": "default",
                      "oidcParams": deploymentRegion.s3.sts.oidcParams,
                      "fallbackOidc": oidc
                  });

        evtAction
            .pipe(
                data =>
                    data.usecaseName === "projectManagement" &&
                    (data.actionName === "projectChanged" ||
                        (data.actionName === "configValueUpdated" &&
                            data.payload.key === "s3"))
            )
            .toStateful()
            .pipe((): [ParamsOfCreateS3Client | undefined] => {
                init_with_project_params: {
                    const customS3ConfigForExplorer =
                        usecases.s3ConfigManagement.protectedSelectors.customS3ConfigForExplorer(
                            getState()
                        );

                    if (customS3ConfigForExplorer === undefined) {
                        break init_with_project_params;
                    }

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
                }

                if (deploymentRegion.s3?.sts === undefined) {
                    return [undefined];
                }

                assert(oidcForS3 !== undefined);

                return [
                    id<ParamsOfCreateS3Client.Sts>({
                        "url": deploymentRegion.s3.url,
                        "isStsEnabled": true,
                        "stsUrl": deploymentRegion.s3.sts.url,
                        "pathStyleAccess": deploymentRegion.s3.pathStyleAccess,
                        "region": deploymentRegion.s3.region,
                        "oidc": oidcForS3,
                        "durationSeconds": deploymentRegion.s3.sts.durationSeconds,
                        "role": deploymentRegion.s3.sts.role,
                        "nameOfBucketToCreateIfNotExist": (() => {
                            const { workingDirectory } = deploymentRegion.s3;

                            if (workingDirectory.bucketMode === "shared") {
                                return undefined;
                            }

                            assert<Equals<typeof workingDirectory.bucketMode, "multi">>();

                            const project =
                                usecases.projectManagement.selectors.currentProject(
                                    getState()
                                );

                            const { username } =
                                usecases.userAuthentication.selectors.user(getState());

                            return project.group === undefined
                                ? `${workingDirectory.bucketNamePrefix}${username}`
                                : `${workingDirectory.bucketNamePrefixGroup}${project.group}`;
                        })()
                    })
                ];
            })
            .pipe(onlyIfChanged())
            .attach(
                paramsOfCreateS3Client =>
                    (context.s3Client =
                        paramsOfCreateS3Client === undefined
                            ? createObjectThatThrowsIfAccessed<S3Client>()
                            : createS3Client(paramsOfCreateS3Client))
            );
    }

    if (oidc.isUserLoggedIn) {
        dispatch(usecases.restorableConfigManagement.protectedThunks.initialize());
    }

    if (oidc.isUserLoggedIn) {
        await dispatch(usecases.userAccountManagement.protectedThunks.initialize());
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
