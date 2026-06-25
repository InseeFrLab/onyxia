import type { Thunks } from "core/bootstrap";
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
        (params: { activeProviderId: string | undefined }) =>
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
        (params: { label: string; apiBase: string; apiKey: string }) =>
        async (...args) => {
            const { label, apiBase, apiKey } = params;
            const [dispatch] = args;

            const providerId = crypto.randomUUID();

            dispatch(
                actions.addCustomProvider({
                    provider: {
                        kind: "custom",
                        id: providerId,
                        label,
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
            label: string;
            apiBase: string;
            apiKey: string;
        }) =>
        async (...args) => {
            const { providerId, label, apiBase, apiKey } = params;
            const [dispatch] = args;

            dispatch(actions.editCustomProvider({ providerId, label, apiBase, apiKey }));

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
                    .map(({ id, label, apiBase, apiKey }) => ({
                        id,
                        label,
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
        }
} satisfies Thunks;

export const protectedThunks = {
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
                    label: p.label,
                    apiBase: p.apiBase,
                    apiKey: p.apiKey,
                    models: { stateDescription: "fetching" },
                    selectedModelId: fromPersistedSelection(persisted?.selections[p.id])
                }));

                const providers = [...regionProviders, ...customProviders];

                const activeProviderId = ((): string | undefined => {
                    // Never saved a preference → default to the first region provider.
                    if (persisted === null) {
                        return regionProviders[0]?.id;
                    }

                    const stored = persisted.activeProviderId ?? undefined;

                    // Stored selection points at a provider that no longer exists.
                    if (stored !== undefined && !providers.some(p => p.id === stored)) {
                        return undefined;
                    }

                    return stored;
                })();

                dispatch(actions.initialized({ providers, activeProviderId }));
            } catch {
                dispatch(actions.initializationFailed());
                return;
            }

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
