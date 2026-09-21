import type { Thunks } from "core/bootstrap";
import { assert } from "tsafe/assert";
import { id } from "tsafe/id";
import { Mutex } from "async-mutex";
import type { XOnyxiaContext } from "core/ports/OnyxiaApi";
import type { AiConfig } from "core/ports/OnyxiaApi/AiConfig";
import { fetchAiModels, type AiModel } from "core/tools/fetchAiModels";
import { exchangeOpenWebUiToken } from "core/tools/exchangeOpenWebUiToken";
import * as userConfigs from "core/usecases/userConfigs";
import { actions, name } from "./state";
import { protectedSelectors, selectors } from "./selectors";
import {
    getConfiguredProviders,
    type AiProvider,
    type ProviderRuntime
} from "./decoupledLogic/aiProviders";
import { emptyAiContext } from "./decoupledLogic/aiContext";
import {
    parseAiConfigStr,
    removeProviderFromPersistedAiConfig,
    renameProviderInPersistedAiConfig,
    serializeAiConfig,
    type PersistedAiConfig
} from "./decoupledLogic/persistedAiConfig";

export const thunks = {
    saveConfig:
        () =>
        async (...[dispatch, getState]): Promise<boolean> => {
            return globalContext.mutex.runExclusive(async () => {
                while (true) {
                    const state = getState()[name];
                    if (
                        state.stateDescription !== "ready" ||
                        state.unsavedConfig === undefined
                    )
                        return true;
                    const aiConfig = state.unsavedConfig;
                    dispatch(actions.configSaveStarted());
                    try {
                        await dispatch(
                            userConfigs.thunks.changeValue({
                                key: "aiConfigStr",
                                value: serializeAiConfig({ aiConfig })
                            })
                        );
                    } catch {
                        dispatch(actions.configSaveFailed());
                        return false;
                    }
                    dispatch(actions.configSaved(aiConfig));
                }
            });
        },
    isAvailable:
        () =>
        (...args): boolean => {
            const [, , { aiConfig, oidc }] = args;

            return !aiConfig.disable && oidc.isUserLoggedIn;
        },
    canUserCreateProviders:
        () =>
        (...args): boolean => {
            const [, , { aiConfig }] = args;

            return !aiConfig.disallowUserToAddProviders;
        },
    /**
     * Idempotent, and safe to call concurrently: both the account tab and the launcher
     * ask for it, whoever comes second waits for the first instead of starting over.
     */
    load:
        () =>
        async (...args): Promise<void> => {
            const [dispatch, getState] = args;

            if (!dispatch(thunks.isAvailable())) {
                return;
            }

            if (globalContext.prLoad !== undefined) {
                return globalContext.prLoad;
            }

            if (selectors.stateDescription(getState()) === "ready") {
                return;
            }

            const prLoad = (async () => {
                dispatch(actions.loadingStarted());

                report_unreadable_config: {
                    const { aiConfigStr } = userConfigs.selectors.userConfigs(getState());

                    if (aiConfigStr === null) {
                        break report_unreadable_config;
                    }

                    if (parseAiConfigStr({ aiConfigStr }) !== undefined) {
                        break report_unreadable_config;
                    }
                }

                dispatch(actions.loaded());

                const aiProviders = selectors.aiProviders(getState());

                assert(aiProviders !== undefined);

                await Promise.all(
                    aiProviders.map(aiProvider =>
                        dispatch(
                            thunks.refreshProvider({ providerName: aiProvider.name })
                        )
                    )
                );
            })();

            globalContext.prLoad = prLoad;

            try {
                await prLoad;
            } catch {
                dispatch(actions.loadingFailed());
            } finally {
                globalContext.prLoad = undefined;
            }
        },
    /**
     * Obtains the provider's API key, then the models it exposes. Concurrent calls for a
     * same provider share the same in-flight request.
     */
    refreshProvider:
        (params: { providerName: string }) =>
        async (...args): Promise<void> => {
            const { providerName } = params;

            const [dispatch] = args;

            const prRefresh_pending =
                globalContext.prRefreshByProviderName.get(providerName);

            if (prRefresh_pending !== undefined) {
                return prRefresh_pending;
            }

            const prRefresh = (async () => {
                const auth = await dispatch(
                    privateThunks.refreshProviderAuth({ providerName })
                );

                if (auth === undefined) {
                    return;
                }

                await dispatch(
                    privateThunks.refreshProviderModels({
                        providerName,
                        apiKey:
                            auth.stateDescription === "authenticated"
                                ? auth.apiKey
                                : undefined
                    })
                );
            })();

            globalContext.prRefreshByProviderName.set(providerName, prRefresh);

            try {
                await prRefresh;
            } finally {
                globalContext.prRefreshByProviderName.delete(providerName);
            }
        },
    /** Refreshes only the exchanged token, leaving the model list untouched. */
    refreshToken:
        (params: { providerName: string }) =>
        async (...[dispatch]): Promise<void> => {
            const provider = dispatch(
                privateThunks.getAiProvider({ providerName: params.providerName })
            );
            assert(provider !== undefined && isAuthenticatedByTokenExchange(provider));
            const pending = globalContext.prRefreshByProviderName.get(
                params.providerName
            );
            if (pending !== undefined) return pending;
            const request = Promise.resolve().then(async () => {
                await dispatch(privateThunks.refreshProviderAuth(params));
            });
            globalContext.prRefreshByProviderName.set(params.providerName, request);
            try {
                await request;
            } finally {
                globalContext.prRefreshByProviderName.delete(params.providerName);
            }
        },
    /** The models the user ticked in a provider's multi select. */
    setSelectedModelIds:
        (params: { providerName: string; modelIds: string[] }) =>
        (...args): void => {
            const { providerName, modelIds } = params;

            const [dispatch] = args;

            const aiProvider = dispatch(privateThunks.getAiProvider({ providerName }));

            assert(aiProvider !== undefined);

            const { models } = aiProvider;

            assert(models.stateDescription === "loaded");
            assert(
                modelIds.every(modelId =>
                    models.availableModels.some(
                        availableModel => availableModel.id === modelId
                    )
                ),
                "a model that the provider doesn't expose can't be selected"
            );

            dispatch(
                privateThunks.updateConfigInMemory({
                    mutate: aiConfig => ({
                        ...aiConfig,
                        selectedModelIdsByProviderName: {
                            ...aiConfig.selectedModelIdsByProviderName,
                            [providerName]: [...new Set(modelIds)]
                        }
                    })
                })
            );
            void dispatch(thunks.saveConfig());
        },
    /**
     * The single model elected among everything the user ticked, across all providers.
     * We don't have to clear it when a selection changes: it is validated on read.
     */
    setDefaultModel:
        (params: {
            defaultModel: { providerName: string; modelId: string } | undefined;
        }) =>
        (...args): void => {
            const { defaultModel } = params;

            const [dispatch] = args;

            if (defaultModel !== undefined) {
                const aiProvider = dispatch(
                    privateThunks.getAiProvider({
                        providerName: defaultModel.providerName
                    })
                );

                assert(aiProvider !== undefined);
                assert(
                    aiProvider.selectedModelIds.includes(defaultModel.modelId),
                    "the default model has to be one of the selected models"
                );
            }

            dispatch(
                privateThunks.updateConfigInMemory({
                    mutate: aiConfig => ({
                        ...aiConfig,
                        defaultModel: defaultModel ?? null
                    })
                })
            );
            void dispatch(thunks.saveConfig());
        },
    /** The key the user brings for an admin configured provider that expects one. */
    setApiKey:
        (params: { providerName: string; apiKey: string }) =>
        async (...args): Promise<void> => {
            const { providerName, apiKey } = params;

            const [dispatch] = args;

            const aiProvider = dispatch(privateThunks.getAiProvider({ providerName }));

            assert(aiProvider !== undefined);
            assert(aiProvider.origin === "configured by admin");

            const { authentification } = aiProvider;

            assert(
                authentification.type === "api-key" &&
                    authentification.obtentionMethod === "user-provided",
                "this provider doesn't accept a user provided API key"
            );

            await dispatch(
                privateThunks.mutatePersistedAiConfig({
                    mutate: aiConfig => ({
                        ...aiConfig,
                        apiKeyByProviderName: {
                            ...aiConfig.apiKeyByProviderName,
                            [providerName]: apiKey.trim()
                        }
                    })
                })
            );

            await dispatch(thunks.refreshProvider({ providerName }));
        },
    /**
     * Creates a provider, or updates the one named `providerName_current`. Model listing
     * is optional: an unreachable provider must still be saved so it can be fixed later.
     */
    createOrUpdateUserProvider:
        (params: {
            providerName_current: string | undefined;
            providerName: string;
            providerType: AiConfig.SupportedAiProviderType;
            apiBase: string;
            apiKey: string;
            availableModels: AiModel[] | undefined;
        }) =>
        async (...args): Promise<void> => {
            const {
                providerName_current,
                providerName,
                providerType,
                apiBase,
                apiKey,
                availableModels
            } = params;

            const [dispatch, getState] = args;

            assert(providerName !== "" && !providerName.includes("/"));

            if (providerName_current === undefined) {
                assert(
                    dispatch(thunks.canUserCreateProviders()),
                    "the instance configuration doesn't let the user add providers"
                );
            }

            const aiProviders = selectors.aiProviders(getState());

            assert(aiProviders !== undefined);

            // The name is the provider's id, it has to stay unique.
            assert(
                !aiProviders.some(
                    aiProvider =>
                        aiProvider.name === providerName &&
                        aiProvider.name !== providerName_current
                ),
                `there is already a provider named ${providerName}`
            );

            await dispatch(
                privateThunks.mutatePersistedAiConfig({
                    mutate: aiConfig => {
                        const aiConfig_renamed =
                            providerName_current === undefined
                                ? aiConfig
                                : renameProviderInPersistedAiConfig({
                                      aiConfig,
                                      providerName_current,
                                      providerName_new: providerName
                                  });

                        return {
                            ...aiConfig_renamed,
                            customProviders: [
                                ...aiConfig_renamed.customProviders.filter(
                                    customProvider => customProvider.name !== providerName
                                ),
                                { name: providerName, providerType, apiBase }
                            ],
                            apiKeyByProviderName: {
                                ...aiConfig_renamed.apiKeyByProviderName,
                                [providerName]: apiKey.trim()
                            }
                        };
                    }
                })
            );

            if (
                providerName_current !== undefined &&
                providerName_current !== providerName
            ) {
                dispatch(
                    actions.userProviderDeleted({ providerName: providerName_current })
                );
            }

            dispatch(actions.userProviderCreated({ providerName, availableModels }));
        },
    deleteUserProvider:
        (params: { providerName: string }) =>
        async (...args): Promise<void> => {
            const { providerName } = params;

            const [dispatch] = args;

            const aiProvider = dispatch(privateThunks.getAiProvider({ providerName }));

            assert(aiProvider !== undefined);
            assert(aiProvider.origin === "created by user");

            await dispatch(
                privateThunks.mutatePersistedAiConfig({
                    mutate: aiConfig =>
                        removeProviderFromPersistedAiConfig({ aiConfig, providerName })
                })
            );

            dispatch(actions.userProviderDeleted({ providerName }));
        }
} satisfies Thunks;

const privateThunks = {
    getAiProvider:
        (params: { providerName: string }) =>
        (...[, getState]): AiProvider | undefined =>
            selectors
                .aiProviders(getState())
                ?.find(aiProvider => aiProvider.name === params.providerName),
    /** undefined when the user hasn't provided any key for this provider. */
    getUserProvidedApiKey:
        (params: { providerName: string }) =>
        (...[, getState]): string | undefined => {
            const apiKey =
                protectedSelectors.persistedAiConfig(getState()).apiKeyByProviderName[
                    params.providerName
                ];

            return apiKey === undefined || apiKey === "" ? undefined : apiKey;
        },
    /**
     * Returns the provider's authentication once settled, or undefined when it didn't
     * settle in a state we can call the provider with.
     */
    refreshProviderAuth:
        (params: { providerName: string }) =>
        async (...args): Promise<AiProvider.Auth | undefined> => {
            const { providerName } = params;

            const [dispatch, , { onyxiaApi, paramsOfBootstrapCore }] = args;

            const aiProvider = dispatch(privateThunks.getAiProvider({ providerName }));

            if (aiProvider === undefined) {
                return undefined;
            }

            // A user created provider is authenticated by the key it was created with,
            // and an admin configured provider that needs no key is authenticated by
            // definition: in both cases there is nothing to obtain.
            if (
                aiProvider.origin === "created by user" ||
                aiProvider.authentification.type === "none"
            ) {
                return aiProvider.auth;
            }

            const { authentification } = aiProvider;

            const apiKey_userProvided = dispatch(
                privateThunks.getUserProvidedApiKey({ providerName })
            );

            if (authentification.obtentionMethod === "user-provided") {
                const auth: ProviderRuntime["auth"] =
                    apiKey_userProvided === undefined
                        ? { stateDescription: "api-key not provided" }
                        : {
                              stateDescription: "authenticated",
                              apiKey: apiKey_userProvided
                          };

                dispatch(actions.providerAuthChanged({ providerName, auth }));

                return auth.stateDescription === "authenticated" ? auth : undefined;
            }

            dispatch(
                actions.providerAuthChanged({
                    providerName,
                    auth: { stateDescription: "fetching" }
                })
            );

            // OIDC is already authenticated at this point: `autoLogin` redirects as
            // needed, so token exchange never transitions through "api-key not provided".
            const auth = await (async (): Promise<ProviderRuntime["auth"]> => {
                const { oidcParams } = await onyxiaApi.getAvailableRegionsAndOidcParams();

                assert(oidcParams !== undefined);

                const { createOidc, mergeOidcParams } = await import(
                    "core/adapters/oidc"
                );

                const oidc = await createOidc({
                    ...mergeOidcParams({
                        oidcParams: oidcParams,
                        oidcParams_partial: authentification.oidcParams
                    }),
                    disableDPoP: true,
                    autoLogin: true,
                    transformBeforeRedirectForKeycloakTheme:
                        paramsOfBootstrapCore.transformBeforeRedirectForKeycloakTheme,
                    getCurrentLang: paramsOfBootstrapCore.getCurrentLang,
                    enableDebugLogs: paramsOfBootstrapCore.enableOidcDebugLogs
                });

                const { accessToken } = await oidc.getTokens();

                let apiKey: string;

                try {
                    apiKey = await exchangeOpenWebUiToken({
                        apiBase: aiProvider.apiBase,
                        oidcAccessToken: accessToken
                    });
                } catch {
                    return { stateDescription: "error" };
                }

                return {
                    stateDescription: "authenticated",
                    apiKey
                };
            })();

            dispatch(actions.providerAuthChanged({ providerName, auth }));

            return auth.stateDescription === "authenticated" ? auth : undefined;
        },
    refreshProviderModels:
        (params: { providerName: string; apiKey: string | undefined }) =>
        async (...args): Promise<void> => {
            const { providerName, apiKey } = params;

            const [dispatch, , rootContext] = args;

            const aiProvider = dispatch(privateThunks.getAiProvider({ providerName }));

            if (aiProvider === undefined) {
                return;
            }

            const isModelListPinnedByAdmin =
                getConfiguredProviders({ aiConfig: rootContext.aiConfig }).find(
                    provider_config => provider_config.name === providerName
                )?.models !== undefined;

            if (isModelListPinnedByAdmin) {
                return;
            }

            dispatch(
                actions.providerModelsChanged({
                    providerName,
                    models: { stateDescription: "fetching" }
                })
            );

            try {
                const availableModels = await fetchAiModels({
                    protocol: aiProvider.providerType,
                    apiBase: aiProvider.apiBase,
                    apiKey
                });

                dispatch(
                    actions.providerModelsChanged({
                        providerName,
                        models: { stateDescription: "loaded", availableModels }
                    })
                );
            } catch {
                dispatch(
                    actions.providerModelsChanged({
                        providerName,
                        models: { stateDescription: "error" }
                    })
                );
            }
        },
    /**
     * Apply edits synchronously in memory. The serialized writer saves the latest
     * snapshot and coalesces edits received while a previous write is in flight.
     */
    updateConfigInMemory:
        (params: { mutate: (aiConfig: PersistedAiConfig) => PersistedAiConfig }) =>
        (...[dispatch, getState]): void => {
            dispatch(
                actions.configChanged(
                    params.mutate(protectedSelectors.persistedAiConfig(getState()))
                )
            );
        },
    mutatePersistedAiConfig:
        (params: { mutate: (aiConfig: PersistedAiConfig) => PersistedAiConfig }) =>
        async (...[dispatch]): Promise<void> => {
            dispatch(privateThunks.updateConfigInMemory(params));
            const isSaved = await dispatch(thunks.saveConfig());
            if (!isSaved) {
                throw new Error("Could not save AI configuration");
            }
        }
} satisfies Thunks;

export const protectedThunks = {
    /**
     * The launch context, as `.ai` of the XOnyxia context. Loads the use case if that
     * hasn't happened yet: nothing is initialized at bootstrap.
     */
    getAiContext:
        () =>
        async (...args): Promise<XOnyxiaContext["ai"]> => {
            const [dispatch, getState] = args;

            if (!dispatch(thunks.isAvailable())) {
                return emptyAiContext;
            }

            const wasLoaded = selectors.stateDescription(getState()) === "ready";

            await dispatch(thunks.load());

            if (selectors.stateDescription(getState()) !== "ready") {
                return emptyAiContext;
            }

            renew_exchanged_keys: {
                if (!wasLoaded) {
                    // They were just obtained by `load()`.
                    break renew_exchanged_keys;
                }

                const aiProviders = selectors.aiProviders(getState());

                assert(aiProviders !== undefined);

                // Keys obtained by exchange are short lived: what we injected into a
                // service launched an hour ago isn't what we should inject now.
                await Promise.all(
                    aiProviders.filter(isAuthenticatedByTokenExchange).map(aiProvider =>
                        dispatch(
                            thunks.refreshToken({
                                providerName: aiProvider.name
                            })
                        )
                    )
                );
            }

            // A refresh started elsewhere, from the account tab, may still be in flight.
            await Promise.all(globalContext.prRefreshByProviderName.values());

            return protectedSelectors.aiContext(getState());
        }
} satisfies Thunks;

const globalContext = {
    prLoad: id<Promise<void> | undefined>(undefined),
    prRefreshByProviderName: new Map<string, Promise<void>>(),
    mutex: new Mutex()
};

function isAuthenticatedByTokenExchange(aiProvider: AiProvider): boolean {
    if (aiProvider.origin !== "configured by admin") {
        return false;
    }

    const { authentification } = aiProvider;

    return (
        authentification.type === "api-key" &&
        authentification.obtentionMethod === "open-webui-oidc-token-exchange"
    );
}
