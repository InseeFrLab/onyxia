import type { Thunks } from "core/bootstrap";
import { actions, name } from "./state";
import type { AiModel, ActiveProvider, ModelSelection, Provider } from "./state";
import {
    parseAiConfigStr,
    serializeAiConfig,
    type PersistedAiConfig,
    type PersistedModelSelection
} from "./decoupledLogic/persistedAiConfig";
import { z } from "zod";
import * as userConfigs from "core/usecases/userConfigs";
import * as deploymentRegionManagement from "core/usecases/deploymentRegionManagement";
import { assert } from "tsafe";

function toPersistedSelection(selection: ModelSelection): PersistedModelSelection {
    return {
        modelId: selection.modelId ?? null
    };
}

function fromPersistedSelection(
    selection: PersistedModelSelection | undefined
): ModelSelection {
    return {
        modelId: selection?.modelId ?? undefined
    };
}

async function fetchModels(apiBase: string, apiKey: string): Promise<AiModel[]> {
    const response = await fetch(`${apiBase}/models`, {
        headers: { Authorization: `Bearer ${apiKey}` }
    });
    if (!response.ok) {
        throw new Error(`Failed to fetch models (${response.status})`);
    }
    const { data } = z
        .object({ data: z.array(z.object({ id: z.string(), name: z.string() })) })
        .parse(await response.json());
    return data.map(({ id, name }) => ({ id, name }));
}

export const thunks = {
    isAvailable:
        () =>
        (...args): boolean => {
            const [, getState] = args;
            const region =
                deploymentRegionManagement.selectors.currentDeploymentRegion(getState());
            return region.ai.length > 0;
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
                actions.regionTokenRefreshed({
                    providerId,
                    token: result.status === "success" ? result.token : undefined
                })
            );
        },
    setActiveProvider:
        (params: { activeProvider: ActiveProvider }) =>
        async (...args) => {
            const { activeProvider } = params;
            const [dispatch] = args;

            dispatch(actions.activeProviderChanged({ activeProvider }));
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
    addCustomProvider:
        (params: { label: string; apiBase: string; apiKey: string }) =>
        async (...args) => {
            const { label, apiBase, apiKey } = params;
            const [dispatch] = args;

            const providerId = crypto.randomUUID();

            dispatch(
                actions.customProviderAdded({
                    provider: {
                        kind: "custom",
                        id: providerId,
                        label,
                        apiBase,
                        apiKey,
                        modelCatalog: { stateDescription: "fetching" },
                        selection: { modelId: undefined }
                    }
                })
            );
            dispatch(
                actions.activeProviderChanged({
                    activeProvider: { kind: "provider", providerId }
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

            dispatch(
                actions.customProviderEdited({ providerId, label, apiBase, apiKey })
            );
            await dispatch(privateThunks.persistConfig());

            await dispatchFetchedModels({ dispatch, providerId, apiBase, apiKey });
        },
    deleteCustomProvider:
        (params: { providerId: string }) =>
        async (...args) => {
            const { providerId } = params;
            const [dispatch] = args;

            dispatch(actions.customProviderDeleted({ providerId }));
            await dispatch(privateThunks.persistConfig());
        },
    testCustomProvider:
        (params: { apiBase: string; apiKey: string }) =>
        async (..._args): Promise<AiModel[]> => {
            const { apiBase, apiKey } = params;
            return fetchModels(apiBase, apiKey);
        }
} satisfies Thunks;

const privateThunks = {
    persistConfig:
        () =>
        async (...args) => {
            const [dispatch, getState] = args;

            const state = getState()[name];

            if (!state.isInitialized) return;

            const aiConfig: PersistedAiConfig = {
                customProviders: state.providers
                    .filter((p): p is Provider.Custom => p.kind === "custom")
                    .map(({ id, label, apiBase, apiKey }) => ({
                        id,
                        label,
                        apiBase,
                        apiKey
                    })),
                selections: Object.fromEntries(
                    state.providers.map(p => [p.id, toPersistedSelection(p.selection)])
                ),
                activeProvider: state.activeProvider
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

            if (ai.length === 0) {
                return;
            }

            dispatch(actions.initializeStarted());

            const persisted = parseAiConfigStr({
                aiConfigStr: userConfigs.selectors.userConfigs(getState()).aiConfigStr
            });

            // Build one region provider per region-provided endpoint, keeping a handle
            // on its adapter + token result for the post-init model fetch.
            const regionEntries = await Promise.all(
                ai.map(async aiProvider => {
                    const tokenResult = await aiProvider.getToken();

                    const provider: Provider.Region = {
                        kind: "region",
                        id: aiProvider.id,
                        name: aiProvider.name,
                        webUiUrl: aiProvider.webUiUrl,
                        apiBase: aiProvider.apiBase,
                        auth: (() => {
                            switch (tokenResult.status) {
                                case "no-account":
                                    return { stateDescription: "no account" };
                                case "error":
                                    return { stateDescription: "error" };
                                case "success":
                                    return {
                                        stateDescription: "authenticated",
                                        token: tokenResult.token
                                    };
                            }
                        })(),
                        modelCatalog: {
                            stateDescription:
                                tokenResult.status === "success"
                                    ? "fetching"
                                    : "not fetched"
                        },
                        selection: fromPersistedSelection(
                            persisted?.selections[aiProvider.id]
                        )
                    };

                    return { provider, aiProvider, tokenResult };
                })
            );

            const regionProviders = regionEntries.map(({ provider }) => provider);

            const customProviders: Provider.Custom[] = (
                persisted?.customProviders ?? []
            ).map(p => ({
                kind: "custom",
                id: p.id,
                label: p.label,
                apiBase: p.apiBase,
                apiKey: p.apiKey,
                modelCatalog: { stateDescription: "fetching" },
                selection: fromPersistedSelection(persisted?.selections[p.id])
            }));

            const providers = [...regionProviders, ...customProviders];

            const activeProvider = ((): ActiveProvider => {
                const stored = persisted?.activeProvider;

                // Never saved a preference → default to the first region provider.
                if (stored === undefined) {
                    const [firstRegionProvider] = regionProviders;
                    return firstRegionProvider === undefined
                        ? { kind: "none" }
                        : { kind: "provider", providerId: firstRegionProvider.id };
                }

                // Stored selection points at a provider that no longer exists.
                if (
                    stored.kind === "provider" &&
                    !providers.some(p => p.id === stored.providerId)
                ) {
                    return { kind: "none" };
                }

                return stored;
            })();

            dispatch(actions.initialized({ providers, activeProvider }));

            await Promise.all([
                ...regionEntries.map(async ({ provider, aiProvider, tokenResult }) => {
                    if (tokenResult.status !== "success") return;
                    try {
                        const models = await aiProvider.listModels(tokenResult.token);
                        dispatch(
                            actions.modelCatalogLoaded({
                                providerId: provider.id,
                                models
                            })
                        );
                    } catch {
                        dispatch(
                            actions.modelCatalogFetchFailed({ providerId: provider.id })
                        );
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
            | ReturnType<typeof actions.modelCatalogLoaded>
            | ReturnType<typeof actions.modelCatalogFetchFailed>
    ) => void;
    providerId: string;
    apiBase: string;
    apiKey: string;
}): Promise<void> {
    const { dispatch, providerId, apiBase, apiKey } = params;
    try {
        const models = await fetchModels(apiBase, apiKey);
        dispatch(actions.modelCatalogLoaded({ providerId, models }));
    } catch {
        dispatch(actions.modelCatalogFetchFailed({ providerId }));
    }
}
