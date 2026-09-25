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
    type AiProviderRuntime,
    type AiProviderWithRuntime,
    getExcludedModelIds
} from "./decoupledLogic/aiProviders";
import { emptyAiContext } from "./decoupledLogic/aiContext";
import {
    createEmptyPersistedAiConfig,
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

                {
                    const { aiConfigStr } = userConfigs.selectors.userConfigs(getState());

                    // Starting over from an empty config would overwrite what is stored
                    // on the first edit: the user has to agree to it, see `resetConfig`.
                    if (
                        aiConfigStr !== null &&
                        parseAiConfigStr({ aiConfigStr }) === undefined
                    ) {
                        dispatch(actions.loadingFailed({ reason: "unreadable config" }));
                        return;
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
                dispatch(actions.loadingFailed({ reason: "loading failed" }));
            } finally {
                globalContext.prLoad = undefined;
            }
        },
    /**
     * Discards a persisted config that can't be read back, then loads again. Every user
     * created provider, API key and selection it held is lost.
     */
    resetConfig:
        () =>
        async (...args): Promise<void> => {
            const [dispatch, getState] = args;

            assert(selectors.errorReason(getState()) === "unreadable config");

            await dispatch(
                userConfigs.thunks.changeValue({
                    key: "aiConfigStr",
                    value: serializeAiConfig({ aiConfig: createEmptyPersistedAiConfig() })
                })
            );

            await dispatch(thunks.load());
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

            await runOncePerProvider({
                providerName,
                run: async () => {
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
                }
            });
        },
    /** Refreshes only the exchanged token, leaving the model list untouched. */
    refreshToken:
        (params: { providerName: string }) =>
        async (...args): Promise<void> => {
            const { providerName } = params;

            const [dispatch] = args;

            const aiProvider = dispatch(privateThunks.getAiProvider({ providerName }));

            assert(
                aiProvider !== undefined && isAuthenticatedByTokenExchange(aiProvider)
            );

            await runOncePerProvider({
                providerName,
                run: async () => {
                    await dispatch(privateThunks.refreshProviderAuth({ providerName }));
                }
            });
        },
    /** The models the user ticked in a provider's multi select, persisted as the ones left out. */
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
                        // Excluded models the provider no longer lists are dropped
                        excludedModelIdsByProviderName: {
                            ...aiConfig.excludedModelIdsByProviderName,
                            [providerName]: getExcludedModelIds({
                                availableModels: models.availableModels,
                                selectedModelIds: modelIds
                            })
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
    /**
     * The key the user brings for an admin configured provider that expects one.
     * `availableModels` are the models listed by a connection test made with this very
     * key: when provided, they are trusted instead of being fetched again.
     */
    setApiKey:
        (params: {
            providerName: string;
            apiKey: string;
            availableModels: AiModel[] | undefined;
        }) =>
        async (...args): Promise<void> => {
            const { providerName, apiKey, availableModels } = params;

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

            if (availableModels === undefined) {
                await dispatch(thunks.refreshProvider({ providerName }));
                return;
            }

            // No network involved: a user provided key is read from the persisted config
            const auth = await dispatch(
                privateThunks.refreshProviderAuth({ providerName })
            );

            // Without a key, the provider can't be used whatever the test said
            if (auth === undefined) {
                return;
            }

            dispatch(
                actions.providerModelsChanged({
                    providerName,
                    models: { stateDescription: "loaded", availableModels }
                })
            );
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
        (...[, getState]): AiProviderWithRuntime | undefined =>
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
        async (...args): Promise<AiProviderRuntime["auth"] | undefined> => {
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
                const auth: AiProviderRuntime["auth"] =
                    apiKey_userProvided === undefined
                        ? { stateDescription: "api-key not provided" }
                        : {
                              stateDescription: "authenticated",
                              apiKey: apiKey_userProvided
                          };

                dispatch(actions.providerAuthChanged({ providerName, auth }));

                if (auth.stateDescription !== "authenticated") {
                    // What was listed with a key that is gone no longer tells anything
                    dispatch(
                        actions.providerModelsChanged({
                            providerName,
                            models: { stateDescription: "not loaded" }
                        })
                    );

                    return undefined;
                }

                return auth;
            }

            dispatch(
                actions.providerAuthChanged({
                    providerName,
                    auth: { stateDescription: "fetching" }
                })
            );

            // OIDC is already authenticated at this point: `autoLogin` redirects as
            // needed, so token exchange never transitions through "api-key not provided".
            const auth = await (async (): Promise<AiProviderRuntime["auth"]> => {
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

            const [dispatch] = args;

            const aiProvider = dispatch(privateThunks.getAiProvider({ providerName }));

            if (aiProvider === undefined) {
                return;
            }

            // NOTE: Called even when the admin pinned the models: it's how we know
            // whether the provider can be reached.

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

/**
 * Talking to a same provider twice at once is pointless: a call made while another one
 * is in flight waits for it instead.
 */
async function runOncePerProvider(params: {
    providerName: string;
    run: () => Promise<void>;
}): Promise<void> {
    const { providerName, run } = params;

    const pr_pending = globalContext.prRefreshByProviderName.get(providerName);

    if (pr_pending !== undefined) {
        return pr_pending;
    }

    const pr = run();

    globalContext.prRefreshByProviderName.set(providerName, pr);

    try {
        await pr;
    } finally {
        globalContext.prRefreshByProviderName.delete(providerName);
    }
}

function isAuthenticatedByTokenExchange(aiProvider: AiProviderWithRuntime): boolean {
    if (aiProvider.origin !== "configured by admin") {
        return false;
    }

    const { authentification } = aiProvider;

    return (
        authentification.type === "api-key" &&
        authentification.obtentionMethod === "open-webui-oidc-token-exchange"
    );
}
