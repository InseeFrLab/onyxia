import {
    createCore,
    createObjectThatThrowsIfAccessed,
    AccessError,
    type GenericCore
} from "clean-architecture";
import type { OnyxiaApi } from "core/ports/OnyxiaApi";
import type { SqlOlap } from "core/ports/SqlOlap";
import type { IcebergApi } from "core/ports/IcebergApi";
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
import { type AiConfig, parseAiConfigFromEnvValue } from "core/ports/OnyxiaApi/AiConfig";
import { setRootContext } from "./rootContext";
import { createDuckDbIcebergApi } from "./adapters/icebergApi";

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
    AI_envValue: string;
};

export type Context = {
    paramsOfBootstrapCore: ParamsOfBootstrapCore;
    oidc: Oidc;
    onyxiaApi: OnyxiaApi;
    secretsManager: SecretsManager;
    sqlOlap: SqlOlap;
    s3Config: S3Config;
    aiConfig: AiConfig;
    icebergApi: IcebergApi;
    icebergCatalogConfigs: { name: string; warehouse: string; endpoint: string }[];
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

    const aiConfig = parseAiConfigFromEnvValue({ envValue: params.AI_envValue });

    let oidc: Oidc | undefined = undefined;

    const onyxiaApi: OnyxiaApi = await (async () => {
        if (onyxiaApiUrl === undefined) {
            const { createOnyxiaApi } = await import("core/adapters/onyxiaApi/mock");

            const oidcParams = (() => {
                const sts = s3Config.entries
                    .map(entry => entry.sts)
                    .find(sts => sts !== undefined);

                if (sts === undefined) {
                    return undefined;
                }

                const { issuerUri, clientId, ...rest } = sts.oidcParams;

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
            enableDebugLogs: enableOidcDebugLogs,
            // NOTE: Open WebUI uses the userinfo endpoint to get the claim of the Access Token.
            // As a result the token used for token exchange with Open WebUI cannot be DPoP bound because
            // the secret required to generate the proof lives on the browser.
            // So, as a temporary workaround until we update oidc-spa we disable DPoP here if we know we're going
            // to be reusing this oidc client instance to request tokens.
            disableDPoP:
                !aiConfig.disable &&
                aiConfig.providers.some(
                    provider =>
                        provider.authentification.type === "api-key" &&
                        provider.authentification.obtentionMethod ===
                            "open-webui-oidc-token-exchange" &&
                        provider.authentification.oidcParams.clientId === undefined
                )
        });
    })();

    if (isAuthGloballyRequired && !oidc.isUserLoggedIn) {
        await oidc.login({ doesCurrentHrefRequiresAuth: true });
    }

    const sqlOlap = createDuckDbSqlOlap({
        getAmbientS3ProfileAndClient: () =>
            dispatch(
                usecases.s3ProfilesManagement.protectedThunks.getAmbientS3ProfileAndClient()
            )
    });

    const context: Context = {
        paramsOfBootstrapCore: params,
        oidc,
        onyxiaApi,
        secretsManager: createObjectThatThrowsIfAccessed<SecretsManager>({
            debugMessage:
                "SecretsManager not initialized, probably because user is not logged in."
        }),
        sqlOlap,
        icebergApi: createObjectThatThrowsIfAccessed<IcebergApi>({
            debugMessage:
                "IcebergApi not initialized, probably because user is not logged in or because iceberg is not configured for the current deployment region."
        }),
        icebergCatalogConfigs: [],
        s3Config,
        aiConfig
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

    init_iceberg_api: {
        if (!oidc.isUserLoggedIn) {
            break init_iceberg_api;
        }

        const deploymentRegion =
            usecases.deploymentRegionManagement.selectors.currentDeploymentRegion(
                getState()
            );

        if (deploymentRegion.iceberg.length === 0) {
            break init_iceberg_api;
        }

        const [{ createOidc, mergeOidcParams }, { oidcParams }] = await Promise.all([
            import("core/adapters/oidc"),
            onyxiaApi.getAvailableRegionsAndOidcParams()
        ]);

        assert(oidcParams !== undefined);

        const catalogs = await Promise.all(
            deploymentRegion.iceberg.map(async warehouseConfig => {
                const oidc_iceberg = await createOidc({
                    ...mergeOidcParams({
                        oidcParams,
                        oidcParams_partial: warehouseConfig.oidcParams
                    }),
                    transformBeforeRedirectForKeycloakTheme,
                    getCurrentLang,
                    autoLogin: true,
                    enableDebugLogs: enableOidcDebugLogs
                });

                return {
                    name: warehouseConfig.catalog,
                    warehouse: warehouseConfig.warehouse,
                    endpoint: warehouseConfig.endpoint,
                    getAccessToken: async (): Promise<string | undefined> => {
                        if (!oidc_iceberg.isUserLoggedIn) return undefined;
                        return (await oidc_iceberg.getTokens()).accessToken;
                    }
                };
            })
        );

        context.icebergApi = createDuckDbIcebergApi({ sqlOlap, catalogs });
        context.icebergCatalogConfigs = deploymentRegion.iceberg.map(wc => ({
            name: wc.catalog,
            warehouse: wc.warehouse,
            endpoint: wc.endpoint
        }));
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

    await dispatch(usecases.s3ProfilesManagement.protectedThunks.initialize());

    pluginSystemInitCore({ core, context });

    return { core };
}

export type State = Core["types"]["State"];

export type Thunks = Core["types"]["Thunks"];

export type CreateEvt = Core["types"]["CreateEvt"];
