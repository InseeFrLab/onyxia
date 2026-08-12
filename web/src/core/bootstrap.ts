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
import type { Language } from "core/ports/OnyxiaApi/Language";
import { createDuckDbSqlOlap } from "core/adapters/sqlOlap";
import { pluginSystemInitCore } from "pluginSystem";
import { createOnyxiaApi } from "core/adapters/onyxiaApi";
import { assert } from "tsafe/assert";
import { fnv1aHashToHex } from "core/tools/fnv1aHashToHex";
import { type S3Config, parseS3ConfigFromEnvValue } from "core/ports/OnyxiaApi/S3Config";
import { setRootContext } from "./rootContext";

export type ParamsOfBootstrapCore = {
    onyxiaApiUrl: string | undefined;
    transformBeforeRedirectForKeycloakTheme: (params: {
        authorizationUrl: string;
    }) => string;
    getCurrentLang: () => Language;
    disablePersonalInfosInjectionInGroup: boolean;
    isCommandBarEnabledByDefault: boolean;
    quotaWarningThresholdPercent: number;
    quotaCriticalThresholdPercent: number;
    isAuthGloballyRequired: boolean;
    enableOidcDebugLogs: boolean;
    disableDisplayAllCatalog: boolean;
    getIsDarkModeEnabled: () => boolean;
    S3_envValue: string;
};

export type Context = {
    paramsOfBootstrapCore: ParamsOfBootstrapCore;
    oidc: Oidc;
    onyxiaApi: OnyxiaApi;
    secretsManager: SecretsManager;
    sqlOlap: SqlOlap;
    s3Config: S3Config;
};

export type Core = GenericCore<typeof usecases, Context>;

export async function bootstrapCore(
    params: ParamsOfBootstrapCore
): Promise<{ core: Core }> {
    const {
        onyxiaApiUrl,
        transformBeforeRedirectForKeycloakTheme,
        getCurrentLang,
        enableOidcDebugLogs
    } = params;

    const isAuthGloballyRequired =
        onyxiaApiUrl === undefined ? true : params.isAuthGloballyRequired;

    let isCoreCreated = false;

    const s3Config = parseS3ConfigFromEnvValue({
        envValue: params.S3_envValue
    });

    let oidc: Oidc | undefined = undefined;

    const onyxiaApi: OnyxiaApi = await (async () => {
        if (onyxiaApiUrl === undefined) {
            const { createOnyxiaApi } = await import("core/adapters/onyxiaApi/mock");

            const oidcParams = (() => {
                const [entry] = s3Config.entries;

                if (entry === undefined) {
                    return undefined;
                }

                const { issuerUri, clientId, ...rest } = entry.sts.oidcParams;

                assert(issuerUri !== undefined, "Missing OIDC Issuer URI");
                assert(clientId !== undefined, "Missing OIDC Client ID");

                return {
                    issuerUri,
                    clientId,
                    ...rest
                };
            })();

            return createOnyxiaApi({
                oidcParams,
                getDecodedIdTokenSub: () => {
                    assert(oidc !== undefined);
                    assert(oidc.isUserLoggedIn);
                    return oidc.getDecodedIdToken().sub;
                }
            });
        }

        return createOnyxiaApi({
            url: onyxiaApiUrl,
            getOidcAccessToken: async () => {
                if (oidc === undefined) {
                    return undefined;
                }

                if (!oidc.isUserLoggedIn) {
                    return undefined;
                }
                return (await oidc.getTokens()).accessToken;
            },
            getCurrentRegionId: () => {
                if (!isCoreCreated) {
                    return undefined;
                }

                let project;

                try {
                    project =
                        usecases.deploymentRegionManagement.selectors.currentDeploymentRegion(
                            getState()
                        );
                } catch (error) {
                    if (error instanceof AccessError) {
                        // NOTE: Not initialized yet, it's not a bug.
                        return undefined;
                    }
                    throw error;
                }

                return project.id;
            },
            getCurrentProjectId: () => {
                if (!isCoreCreated) {
                    return undefined;
                }

                let project;

                try {
                    project =
                        usecases.projectManagement.protectedSelectors.currentProject(
                            getState()
                        );
                } catch (error) {
                    if (error instanceof AccessError) {
                        // NOTE: Not initialized yet, it's not a bug.
                        return undefined;
                    }
                    throw error;
                }

                return project.id;
            }
        });
    })();

    oidc = await (async () => {
        const { oidcParams } = await onyxiaApi.getAvailableRegionsAndOidcParams();

        if (oidcParams === undefined) {
            const { createOidc } = await import("core/adapters/oidc/mock");

            return createOidc({ isUserInitiallyLoggedIn: true });
        }

        const { createOidc } = await import("core/adapters/oidc");

        return createOidc({
            ...oidcParams,
            transformBeforeRedirectForKeycloakTheme,
            getCurrentLang,
            autoLogin: false,
            enableDebugLogs: enableOidcDebugLogs
        });
    })();

    if (isAuthGloballyRequired && !oidc.isUserLoggedIn) {
        await oidc.login({ doesCurrentHrefRequiresAuth: true });
        // NOTE: Never reached
    }

    const context: Context = {
        paramsOfBootstrapCore: params,
        oidc,
        onyxiaApi,
        secretsManager: createObjectThatThrowsIfAccessed<SecretsManager>({
            debugMessage:
                "SecretsManager not initialized, probably because user is not logged in."
        }),
        sqlOlap: createDuckDbSqlOlap({
            getS3Client: async () => {
                if (!oidc.isUserLoggedIn) {
                    return {
                        errorCause: "need login"
                    };
                }

                const result = await dispatch(
                    usecases.s3ProfilesManagement.protectedThunks.getAmbientS3ProfileAndClient()
                );

                if (result === undefined) {
                    return {
                        errorCause: "no s3 client"
                    };
                }

                const { s3Profile, s3Client } = result;

                return {
                    s3Client,
                    s3_endpoint: s3Profile.paramsOfCreateS3Client.url,
                    s3_url_style: s3Profile.paramsOfCreateS3Client.pathStyleAccess
                        ? "path"
                        : "vhost",
                    s3_region: s3Profile.paramsOfCreateS3Client.region
                };
            }
        }),
        s3Config
    };

    setRootContext(context);

    const { core, dispatch, getState } = createCore({
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

        const [{ createSecretManager }, { createOidc, mergeOidcParams }, { oidcParams }] =
            await Promise.all([
                import("core/adapters/secretManager"),
                import("core/adapters/oidc"),
                onyxiaApi.getAvailableRegionsAndOidcParams()
            ]);

        assert(oidcParams !== undefined);

        const oidc_vault = await createOidc({
            ...mergeOidcParams({
                oidcParams,
                oidcParams_partial: deploymentRegion.vault.oidcParams
            }),
            transformBeforeRedirectForKeycloakTheme,
            getCurrentLang,
            autoLogin: true,
            enableDebugLogs: enableOidcDebugLogs
        });

        const doClearCachedVaultToken: boolean = await (async () => {
            const { projects } = await onyxiaApi.getUserAndProjects();

            const KEY = "onyxia:vault:projects-hash";

            const hash = fnv1aHashToHex(JSON.stringify(projects));

            if (!oidc_vault.isNewBrowserSession && sessionStorage.getItem(KEY) === hash) {
                return false;
            }

            sessionStorage.setItem(KEY, hash);
            return true;
        })();

        context.secretsManager = await createSecretManager({
            kvEngine: deploymentRegion.vault.kvEngine,
            role: deploymentRegion.vault.role,
            url: deploymentRegion.vault.url,
            authPath: deploymentRegion.vault.authPath,
            getAccessToken: async () => (await oidc_vault.getTokens()).accessToken,
            doClearCachedVaultToken
        });
    }

    init_userConfigs: {
        if (!oidc.isUserLoggedIn) {
            break init_userConfigs;
        }

        await dispatch(usecases.userConfigs.protectedThunks.initialize());
    }

    init_projectManagement: {
        if (!oidc.isUserLoggedIn) {
            break init_projectManagement;
        }
        await dispatch(usecases.projectManagement.protectedThunks.initialize());
    }

    init_restorableConfigManagement: {
        if (!oidc.isUserLoggedIn) {
            break init_restorableConfigManagement;
        }
        if (onyxiaApiUrl === undefined) {
            break init_restorableConfigManagement;
        }

        dispatch(usecases.restorableConfigManagement.protectedThunks.initialize());
    }

    init_userProfileForm: {
        if (!oidc.isUserLoggedIn) {
            break init_userProfileForm;
        }
        if (onyxiaApiUrl === undefined) {
            break init_userProfileForm;
        }

        await dispatch(usecases.userProfileForm.protectedThunks.initialize());
    }

    init_s3ProfilesManagement: {
        if (!oidc.isUserLoggedIn) {
            break init_s3ProfilesManagement;
        }

        await dispatch(usecases.s3ProfilesManagement.protectedThunks.initialize());
    }

    pluginSystemInitCore({ core, context });

    return { core };
}

export type State = Core["types"]["State"];

export type Thunks = Core["types"]["Thunks"];

export type CreateEvt = Core["types"]["CreateEvt"];
