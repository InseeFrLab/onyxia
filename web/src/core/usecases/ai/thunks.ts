import type { Thunks } from "core/bootstrap";
import { createUsecaseContextApi } from "clean-architecture";
import { actions, name } from "./state";
import type { State } from "./state";
import {
    parseAiConfigStr,
    serializeAiConfig,
    type PersistedAiConfig,
    type PersistedModelSelection
} from "./decoupledLogic/persistedAiConfig";
import { fetchAiModels } from "core/tools/fetchAiModels";
import type { GetTokenResult } from "core/ports/Ai";
import * as userConfigs from "core/usecases/userConfigs";
import { assert } from "tsafe";

function getTokenResultToAuth(result: GetTokenResult): State.Provider.Region["auth"] {
    switch (result.status) {
        case "no-account":
            return { stateDescription: "no account" };
        case "error":
            return { stateDescription: "error" };
        case "success":
            return { stateDescription: "authenticated", token: result.token };
    }
}

function toPersistedSelection(
    selectedModel: string | undefined
): PersistedModelSelection {
    return {
        modelId: selectedModel ?? null
    };
}

function fromPersistedSelection(
    selection: PersistedModelSelection | undefined
): string | undefined {
    return selection?.modelId ?? undefined;
}

export const thunks = {
    isAvailable:
        () =>
        (...args): boolean => {
            const [, , { paramsOfBootstrapCore }] = args;

            return paramsOfBootstrapCore.isAiEnabled;
        },
    refreshToken:
        (params: { providerId: string }) =>
        async (...args) => {
            const { providerId } = params;
            const [dispatch, , { ai }] = args;

            const aiProvider = ai.find(aiProvider => aiProvider.id === providerId);

            assert(aiProvider !== undefined);

            const result = await aiProvider.getToken();

            dispatch(
                actions.regionAuthRefreshed({
                    providerId,
                    auth: getTokenResultToAuth(result)
                })
            );
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
        (params: { name: string; provider: string; apiBase: string; apiKey: string }) =>
        async (...args) => {
            const { name, provider, apiBase, apiKey } = params;
            const [dispatch] = args;

            const providerId = crypto.randomUUID();

            dispatch(
                actions.addCustomProvider({
                    provider: {
                        kind: "custom",
                        id: providerId,
                        name,
                        provider,
                        apiBase,
                        apiKey,
                        models: { stateDescription: "fetching" },
                        selectedModelId: undefined
                    }
                })
            );

            await dispatch(privateThunks.persistConfig());
            await dispatchFetchedModels({ dispatch, providerId, apiBase, apiKey });
        },
    editCustomProvider:
        (params: {
            providerId: string;
            name: string;
            provider: string;
            apiBase: string;
            apiKey: string;
        }) =>
        async (...args) => {
            const { providerId, name, provider, apiBase, apiKey } = params;
            const [dispatch] = args;

            dispatch(
                actions.editCustomProvider({
                    providerId,
                    name: name,
                    provider,
                    apiBase,
                    apiKey
                })
            );

            await dispatch(privateThunks.persistConfig());
            await dispatchFetchedModels({ dispatch, providerId, apiBase, apiKey });
        },
    // Command-query thunk: the connection-test result is purely UI-local (it never
    // touches the persisted state), so returning it here is intentional.
    testCustomProviderConnection:
        (params: { apiBase: string; apiKey: string }) =>
        async (): Promise<{ modelCount: number }> => {
            const { apiBase, apiKey } = params;
            const models = await fetchAiModels({ apiBase, token: apiKey });
            return { modelCount: models.length };
        }
} satisfies Thunks;

const privateThunks = {
    persistConfig:
        () =>
        async (...args) => {
            const [dispatch, getState] = args;

            const state = getState()[name];

            if (state.stateDescription !== "initialized") return;

            const aiConfig: PersistedAiConfig = {
                customProviders: state.providers
                    .filter((p): p is State.Provider.Custom => p.kind === "custom")
                    .map(({ id, name, provider, apiBase, apiKey }) => ({
                        id,
                        name,
                        provider,
                        apiBase,
                        apiKey
                    })),
                selections: Object.fromEntries(
                    state.providers.map(p => [
                        p.id,
                        toPersistedSelection(p.selectedModelId)
                    ])
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
            const [dispatch, getState, { ai }] = args;

            // `ai` (region-provided adapters) may be empty: the feature can be enabled
            // with no region gateway, in which case only custom providers are loaded.
            // Build one region provider per region-provided endpoint, keeping a handle
            // on its adapter + token result for the post-init model fetch.
            let regionEntries;
            let customProviders: State.Provider.Custom[];

            try {
                const persisted = parseAiConfigStr({
                    aiConfigStr: userConfigs.selectors.userConfigs(getState()).aiConfigStr
                });

                regionEntries = await Promise.all(
                    ai.map(async aiProvider => {
                        const tokenResult = await aiProvider.getToken();

                        const provider: State.Provider.Region = {
                            kind: "region",
                            id: aiProvider.id,
                            name: aiProvider.name,
                            provider: aiProvider.provider,
                            webUiUrl: aiProvider.webUiUrl,
                            apiBase: aiProvider.apiBase,
                            auth: getTokenResultToAuth(tokenResult),
                            models:
                                tokenResult.status === "success"
                                    ? { stateDescription: "fetching" }
                                    : undefined,
                            selectedModelId: fromPersistedSelection(
                                persisted?.selections[aiProvider.id]
                            )
                        };

                        return { provider, aiProvider, tokenResult };
                    })
                );

                const regionProviders = regionEntries.map(({ provider }) => provider);

                customProviders = (persisted?.customProviders ?? []).map(p => ({
                    kind: "custom",
                    id: p.id,
                    name: p.name,
                    // Configs persisted before the field existed default to "openai".
                    provider: p.provider ?? "openai",
                    apiBase: p.apiBase,
                    apiKey: p.apiKey,
                    models: { stateDescription: "fetching" },
                    selectedModelId: fromPersistedSelection(persisted?.selections[p.id])
                }));

                const providers = [...regionProviders, ...customProviders];
                const defaultableProviderIds = [
                    ...regionEntries
                        .filter(({ tokenResult }) => tokenResult.status === "success")
                        .map(({ provider }) => provider.id),
                    ...customProviders.map(provider => provider.id)
                ];

                const activeProviderId = ((): string | undefined => {
                    // Never saved a preference → default to the first usable provider.
                    if (persisted === null) {
                        return defaultableProviderIds[0];
                    }

                    const stored = persisted.activeProviderId ?? undefined;

                    if (stored !== undefined && defaultableProviderIds.includes(stored)) {
                        return stored;
                    }

                    return defaultableProviderIds[0];
                })();

                dispatch(actions.initialized({ providers, activeProviderId }));
            } catch {
                dispatch(actions.initializationFailed());
                return;
            }

            // Awaited so the whole AI context (providers + their model lists) is
            // ready before `initialize` resolves. Bootstrap awaits this thunk, and
            // `getCoreSync` suspends until bootstrap resolves, so the launcher's
            // one-shot read of `aiOnyxiaContext` always sees the loaded models.
            await Promise.all([
                ...regionEntries.map(async ({ provider, aiProvider, tokenResult }) => {
                    if (tokenResult.status !== "success") return;
                    try {
                        const models = await aiProvider.listModels(tokenResult.token);
                        dispatch(
                            actions.modelsLoaded({
                                providerId: provider.id,
                                models
                            })
                        );
                    } catch {
                        dispatch(actions.modelsFetchFailed({ providerId: provider.id }));
                    }
                }),
                ...customProviders.map(p =>
                    dispatchFetchedModels({
                        dispatch,
                        providerId: p.id,
                        apiBase: p.apiBase,
                        apiKey: p.apiKey
                    })
                )
            ]);
        }
} satisfies Thunks;

const { getContext, setContext, getIsContextSet } = createUsecaseContextApi<{
    prInitialized: Promise<void>;
}>();

export const protectedThunks = {
    // Initiates the AI use-case. Dispatched once by bootstrap, *after* the region AI
    // adapters have been wired into `context.ai`. Idempotent: a second dispatch
    // returns the same in-flight promise. This is the ONLY place that starts the
    // work — consumers must use `waitForInitialization`, never call this, so they
    // can't lock the context before `context.ai` is populated.
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
    // autocomplete, before bootstrap has wired up the region adapters), and a
    // premature init would build the providers from an empty `context.ai` and
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
    apiBase: string;
    apiKey: string;
}): Promise<void> {
    const { dispatch, providerId, apiBase, apiKey } = params;
    try {
        const models = await fetchAiModels({ apiBase, token: apiKey });
        dispatch(actions.modelsLoaded({ providerId, models }));
    } catch {
        dispatch(actions.modelsFetchFailed({ providerId }));
    }
}
