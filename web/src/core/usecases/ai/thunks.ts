import type { Thunks } from "core/bootstrap";
import { createUsecaseContextApi } from "clean-architecture";
import { actions, name } from "./state";
import type { State } from "./state";
import {
    parseAiConfigStr,
    serializeAiConfig,
    type PersistedAiConfig
} from "./decoupledLogic/persistedAiConfig";
import { fetchAiModels } from "core/tools/fetchAiModels";
import * as userConfigs from "core/usecases/userConfigs";
import { assert } from "tsafe";
import type { AiGateway } from "core/ports/AiGateway";

function accessTokenResultToAuth(
    result: AiGateway.AccessTokenResult
): State.AiProvider.Managed["auth"] {
    if (result.ok) {
        return {
            stateDescription: "authenticated",
            accessToken: result.accessToken
        };
    }

    switch (result.error.kind) {
        case "no-account":
            return { stateDescription: "no account" };
        case "unexpected":
            return { stateDescription: "error" };
    }
}

async function getAccessTokenSafely(
    aiGateway: AiGateway
): Promise<AiGateway.AccessTokenResult> {
    try {
        return await aiGateway.getAccessToken();
    } catch (cause) {
        return {
            ok: false,
            error: {
                kind: "unexpected",
                cause: cause instanceof Error ? cause : new Error(String(cause))
            }
        };
    }
}

export const thunks = {
    isAvailable:
        () =>
        (...args): boolean => {
            const [, , { paramsOfBootstrapCore }] = args;

            return paramsOfBootstrapCore.isAiEnabled;
        },
    refreshAccessToken:
        (params: { providerId: string }) =>
        async (...args) => {
            const { providerId } = params;
            const [dispatch, , { aiGateways }] = args;

            const aiGateway = aiGateways.find(aiGateway => aiGateway.id === providerId);

            assert(aiGateway !== undefined);

            dispatch(actions.managedAuthFetchStarted({ providerId }));

            const result = await getAccessTokenSafely(aiGateway);

            dispatch(
                actions.managedAuthRefreshed({
                    providerId,
                    auth: accessTokenResultToAuth(result)
                })
            );

            if (!result.ok) {
                return;
            }

            dispatch(actions.modelsFetchStarted({ providerId }));

            try {
                const models = await aiGateway.listModels(result.accessToken);
                dispatch(actions.modelsLoaded({ providerId, models }));
            } catch {
                dispatch(actions.modelsFetchFailed({ providerId }));
            }
        },
    setActiveProvider:
        (params: { activeProviderId: string }) =>
        async (...args) => {
            const { activeProviderId } = params;
            const [dispatch] = args;

            dispatch(actions.activeProviderChanged({ activeProviderId }));
            await dispatch(privateThunks.persistConfig());
        },
    setSelectedModel:
        (params: { providerId: string; modelId: string }) =>
        async (...args) => {
            const { providerId, modelId } = params;
            const [dispatch] = args;

            dispatch(actions.modelSelected({ providerId, modelId }));
            await dispatch(privateThunks.persistConfig());
        },
    deleteCustomProvider:
        (params: { providerId: string }) =>
        async (...args) => {
            const { providerId } = params;
            const [dispatch] = args;

            dispatch(actions.deleteCustomProvider({ providerId }));
            await dispatch(privateThunks.persistConfig());
        },
    // The add/edit form (values, validation, connection-test result, open state) is
    // owned by the UI. The core only exposes the resulting operations on the state.
    addCustomProvider:
        (params: {
            name: string;
            protocol: string;
            apiBase: string;
            apiKey: string;
            models: State.AiModel[];
            selectedModelId: string;
            doSetAsDefault: boolean;
        }) =>
        async (...args) => {
            const {
                name: providerName,
                protocol,
                apiBase,
                apiKey,
                models,
                selectedModelId,
                doSetAsDefault
            } = params;
            const [dispatch, getState] = args;

            const providerId = crypto.randomUUID();
            const stateBeforeAddition = getState()[name];

            assert(stateBeforeAddition.stateDescription === "initialized");

            const previousActiveProviderId = stateBeforeAddition.activeProviderId;

            dispatch(
                actions.addCustomProvider({
                    aiProvider: {
                        kind: "custom",
                        id: providerId,
                        name: providerName,
                        protocol,
                        apiBase,
                        apiKey,
                        models: { stateDescription: "loaded", availableModels: models },
                        selectedModelId
                    }
                })
            );

            if (doSetAsDefault) {
                dispatch(actions.activeProviderChanged({ activeProviderId: providerId }));
            }

            try {
                await dispatch(privateThunks.persistConfig());
            } catch (error) {
                dispatch(actions.deleteCustomProvider({ providerId }));
                dispatch(
                    actions.activeProviderChanged({
                        activeProviderId: previousActiveProviderId
                    })
                );
                throw error;
            }
        },
    editCustomProvider:
        (params: {
            providerId: string;
            name: string;
            protocol: string;
            apiBase: string;
            apiKey: string;
            models: State.AiModel[];
            selectedModelId: string;
            doSetAsDefault: boolean;
        }) =>
        async (...args) => {
            const {
                providerId,
                name,
                protocol,
                apiBase,
                apiKey,
                models,
                selectedModelId,
                doSetAsDefault
            } = params;
            const [dispatch] = args;

            dispatch(
                actions.editCustomProvider({
                    providerId,
                    name: name,
                    protocol,
                    apiBase,
                    apiKey,
                    models,
                    selectedModelId
                })
            );

            if (doSetAsDefault) {
                dispatch(actions.activeProviderChanged({ activeProviderId: providerId }));
            }

            await dispatch(privateThunks.persistConfig());
        },
    // Command-query thunk: the connection-test result is purely UI-local (it never
    // touches the persisted state), so returning it here is intentional.
    testCustomProviderConnection:
        (params: { protocol: string; apiBase: string; apiKey: string }) =>
        async (): Promise<{ models: State.AiModel[] }> => {
            const { protocol, apiBase, apiKey } = params;
            const models = await fetchAiModels({
                protocol,
                apiBase,
                apiKey
            });
            return { models };
        }
} satisfies Thunks;

const privateThunks = {
    persistConfig:
        () =>
        async (...args) => {
            const [dispatch, getState] = args;

            const state = getState()[name];

            assert(state.stateDescription === "initialized");

            const aiConfig: PersistedAiConfig = {
                customProviders: state.providers
                    .filter((p): p is State.AiProvider.Custom => p.kind === "custom")
                    .map(({ id, name, protocol, apiBase, apiKey }) => ({
                        id,
                        name,
                        provider: protocol,
                        apiBase,
                        apiKey
                    })),
                selections: Object.fromEntries(
                    state.providers.map(p => [p.id, p.selectedModelId ?? null])
                ),
                activeProviderId: state.activeProviderId ?? null
            };

            await dispatch(
                userConfigs.thunks.changeValue({
                    key: "aiConfigStr",
                    value: serializeAiConfig({ aiConfig })
                })
            );
        },
    initialize:
        () =>
        async (...args) => {
            const [dispatch, getState, { aiGateways }] = args;

            // `aiGateways` may be empty: the feature can be enabled with only custom
            // providers. Managed gateway authentication is deliberately provider-local:
            // it must never prevent the global use case from becoming initialized.
            let managedProviders: State.AiProvider.Managed[];
            let customProviders: State.AiProvider.Custom[];
            let persisted: PersistedAiConfig | null;

            try {
                persisted = parseAiConfigStr({
                    aiConfigStr: userConfigs.selectors.userConfigs(getState()).aiConfigStr
                });

                managedProviders = aiGateways.map(aiGateway => ({
                    kind: "managed",
                    id: aiGateway.id,
                    name: aiGateway.name,
                    protocol: aiGateway.protocol,
                    description: aiGateway.description,
                    accountCreation: aiGateway.accountCreation,
                    webUiUrl: aiGateway.webUiUrl,
                    apiBase: aiGateway.apiBase,
                    auth: { stateDescription: "fetching" },
                    models: undefined,
                    selectedModelId: persisted?.selections[aiGateway.id] ?? undefined
                }));

                customProviders = (persisted?.customProviders ?? []).map(p => ({
                    kind: "custom",
                    id: p.id,
                    name: p.name,
                    protocol: p.provider,
                    apiBase: p.apiBase,
                    apiKey: p.apiKey,
                    models: { stateDescription: "fetching" },
                    selectedModelId: persisted?.selections[p.id] ?? undefined
                }));

                const providers = [...managedProviders, ...customProviders];
                const storedActiveProviderId = persisted?.activeProviderId ?? undefined;
                const activeProviderId = providers.some(
                    provider => provider.id === storedActiveProviderId
                )
                    ? storedActiveProviderId
                    : undefined;

                dispatch(actions.initialized({ providers, activeProviderId }));
            } catch {
                dispatch(actions.initializationFailed());
                return;
            }

            // The UI is already usable at this point. These calls remain awaited by the
            // initialization promise so the launcher's one-shot AI context contains the
            // final authentication and model-list results.
            await Promise.all([
                ...aiGateways.map(async aiGateway => {
                    const accessTokenResult = await getAccessTokenSafely(aiGateway);

                    dispatch(
                        actions.managedAuthRefreshed({
                            providerId: aiGateway.id,
                            auth: accessTokenResultToAuth(accessTokenResult)
                        })
                    );

                    if (!accessTokenResult.ok) return;

                    dispatch(actions.modelsFetchStarted({ providerId: aiGateway.id }));

                    try {
                        const models = await aiGateway.listModels(
                            accessTokenResult.accessToken
                        );
                        dispatch(
                            actions.modelsLoaded({
                                providerId: aiGateway.id,
                                models
                            })
                        );
                    } catch {
                        dispatch(
                            actions.modelsFetchFailed({
                                providerId: aiGateway.id
                            })
                        );
                    }
                }),
                ...customProviders.map(p =>
                    dispatchFetchedModels({
                        dispatch,
                        providerId: p.id,
                        protocol: p.protocol,
                        apiBase: p.apiBase,
                        apiKey: p.apiKey
                    })
                )
            ]);

            const state = getState()[name];

            assert(state.stateDescription === "initialized");

            const activeProvider = state.providers.find(
                provider => provider.id === state.activeProviderId
            );
            const activeProviderIsUsable =
                activeProvider !== undefined &&
                (activeProvider.kind === "custom" ||
                    activeProvider.auth.stateDescription === "authenticated");

            if (activeProviderIsUsable) {
                return;
            }

            dispatch(
                actions.activeProviderChanged({
                    activeProviderId: state.providers.find(
                        provider =>
                            provider.kind === "custom" ||
                            provider.auth.stateDescription === "authenticated"
                    )?.id
                })
            );
        }
} satisfies Thunks;

const { getContext, setContext, getIsContextSet } = createUsecaseContextApi<{
    prInitialized: Promise<void>;
}>();

export const protectedThunks = {
    // Initiates the AI use-case. Dispatched once by bootstrap, *after* the managed AI
    // gateways have been wired into `context.aiGateways`. Idempotent: a second dispatch
    // returns the same in-flight promise. This is the ONLY place that starts the
    // work — consumers must use `waitForInitialization`, never call this, so they
    // can't lock the context before `context.aiGateways` is populated.
    initialize:
        () =>
        (...args): Promise<void> => {
            const [dispatch, , rootContext] = args;

            if (getIsContextSet(rootContext)) {
                return getContext(rootContext).prInitialized;
            }

            const prInitialized = dispatch(privateThunks.initialize());

            setContext(rootContext, { prInitialized });

            return prInitialized;
        },
    // Awaits the in-flight initialization if it has started, otherwise resolves
    // immediately. Crucially it never triggers the init itself: callers like the
    // launcher's `getXOnyxiaContext` can run very early (restorable-config
    // autocomplete, before bootstrap has wired up the managed adapters), and a
    // premature init would build the providers from an empty `context.aiGateways` and
    // freeze that wrong state. Early callers simply see the AI context as
    // not-yet-available; the real init happens later in bootstrap.
    waitForInitialization:
        () =>
        async (...args): Promise<void> => {
            const [, , rootContext] = args;

            if (!getIsContextSet(rootContext)) {
                return;
            }

            await getContext(rootContext).prInitialized;
        }
} satisfies Thunks;

async function dispatchFetchedModels(params: {
    dispatch: (
        action:
            | ReturnType<typeof actions.modelsLoaded>
            | ReturnType<typeof actions.modelsFetchFailed>
    ) => void;
    providerId: string;
    protocol: string;
    apiBase: string;
    apiKey: string;
}): Promise<void> {
    const { dispatch, providerId, protocol, apiBase, apiKey } = params;
    try {
        const models = await fetchAiModels({ protocol, apiBase, apiKey });
        dispatch(actions.modelsLoaded({ providerId, models }));
    } catch {
        dispatch(actions.modelsFetchFailed({ providerId }));
    }
}
