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

type ParamsOfBootstrapCore = {
    apiUrl: string;
    transformBeforeRedirectForKeycloakTheme: (params: {
        authorizationUrl: string;
    }) => string;
    getCurrentLang: () => Language;
    disablePersonalInfosInjectionInGroup: boolean;
    isCommandBarEnabledByDefault: boolean;
    quotaWarningThresholdPercent: number;
    quotaCriticalThresholdPercent: number;
    isAuthGloballyRequired: boolean;
};

export type Context = {
    paramsOfBootstrapCore: ParamsOfBootstrapCore;
    oidc: Oidc;
    onyxiaApi: OnyxiaApi;
    secretsManager: SecretsManager;
    sqlOlap: SqlOlap;
};

export type Core = GenericCore<typeof usecases, Context>;

export async function bootstrapCore(
    params: ParamsOfBootstrapCore
): Promise<{ core: Core }> {
    const {
        apiUrl,
        transformBeforeRedirectForKeycloakTheme,
        getCurrentLang,
        isAuthGloballyRequired
    } = params;

    let isCoreCreated = false;

    let oidc: Oidc | undefined = undefined;

    const onyxiaApi = createOnyxiaApi({
        url: apiUrl,
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
            autoLogin: false
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
            getS3Config: async () => {
                if (!oidc.isUserLoggedIn) {
                    return undefined;
                }

                const result = await dispatch(
                    usecases.s3ConfigManagement.protectedThunks.getS3ConfigAndClientForExplorer()
                );

                if (result === undefined) {
                    return undefined;
                }

                const { s3Config, s3Client } = result;

                const tokens = await s3Client.getToken({ doForceRenew: false });

                return {
                    s3_endpoint: s3Config.paramsOfCreateS3Client.url,
                    credentials:
                        tokens === undefined
                            ? undefined
                            : {
                                  s3_access_key_id: tokens.accessKeyId,
                                  s3_secret_access_key: tokens.secretAccessKey,
                                  s3_session_token: tokens.sessionToken
                              },
                    s3_url_style: s3Config.paramsOfCreateS3Client.pathStyleAccess
                        ? "path"
                        : "vhost"
                };
            }
        })
    };

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
            autoLogin: true
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

    if (oidc.isUserLoggedIn) {
        await dispatch(usecases.userConfigs.protectedThunks.initialize());
    }

    if (oidc.isUserLoggedIn) {
        await dispatch(usecases.projectManagement.protectedThunks.initialize());
    }

    if (oidc.isUserLoggedIn) {
        dispatch(usecases.restorableConfigManagement.protectedThunks.initialize());
    }

    pluginSystemInitCore({ core, context });

    return { core };
}

export type State = Core["types"]["State"];

export type Thunks = Core["types"]["Thunks"];

export type CreateEvt = Core["types"]["CreateEvt"];
