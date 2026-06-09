import type { Thunks } from "core/bootstrap";
import { actions } from "./state";
import type { AiModel, CustomAiProvider } from "./state";
import { z } from "zod";
import { getLocalStorage } from "core/tools/safeLocalStorage";
import * as deploymentRegionManagement from "core/usecases/deploymentRegionManagement";
import { assert } from "tsafe";
import { id } from "tsafe/id";

const SELECTED_MODEL_STORAGE_KEY = "onyxia:ai:selectedModel";
const CUSTOM_PROVIDERS_STORAGE_KEY = "onyxia:ai:customProviders";

type PersistedCustomProvider = {
    id: string;
    label: string;
    apiBase: string;
    apiKey: string;
    selectedModel: string | undefined;
};

type LocalStorageLike = Pick<Storage, "getItem" | "setItem">;

function readPersistedProviders(
    localStorage: LocalStorageLike
): PersistedCustomProvider[] {
    const raw = localStorage.getItem(CUSTOM_PROVIDERS_STORAGE_KEY);
    if (raw === null) return [];
    try {
        return JSON.parse(raw) as PersistedCustomProvider[];
    } catch {
        return [];
    }
}

function writePersistedProviders(
    localStorage: LocalStorageLike,
    providers: PersistedCustomProvider[]
): void {
    localStorage.setItem(CUSTOM_PROVIDERS_STORAGE_KEY, JSON.stringify(providers));
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
            return region.ai !== undefined;
        },
    refreshToken:
        () =>
        async (...args) => {
            const [dispatch, , { ai }] = args;

            assert(ai !== undefined);

            const result = await ai.getToken();

            if (result.status !== "success") {
                dispatch(actions.tokenRefreshFailed());
                return;
            }

            dispatch(actions.tokenRefreshed({ token: result.token }));
        },
    setSelectedModel:
        (params: { model: string }) =>
        (...args) => {
            const { model } = params;
            const [dispatch] = args;

            const { localStorage } = getLocalStorage();

            localStorage.setItem(SELECTED_MODEL_STORAGE_KEY, model);

            dispatch(actions.selectedModelSet({ model }));
        },
    addCustomProvider:
        (params: { label: string; apiBase: string; apiKey: string }) =>
        async (...args) => {
            const { label, apiBase, apiKey } = params;
            const [dispatch] = args;

            const { localStorage } = getLocalStorage();

            const providerId = crypto.randomUUID();

            dispatch(
                actions.customProviderAdded(
                    id<CustomAiProvider>({
                        id: providerId,
                        label,
                        apiBase,
                        apiKey,
                        availableModels: [],
                        selectedModel: undefined,
                        modelsFetchStatus: "fetching"
                    })
                )
            );

            const persisted = readPersistedProviders(localStorage);
            persisted.push({
                id: providerId,
                label,
                apiBase,
                apiKey,
                selectedModel: undefined
            });
            writePersistedProviders(localStorage, persisted);

            try {
                const models = await fetchModels(apiBase, apiKey);
                dispatch(actions.customProviderModelsLoaded({ id: providerId, models }));
            } catch {
                dispatch(actions.customProviderModelsFetchFailed({ id: providerId }));
            }
        },
    deleteCustomProvider:
        (params: { id: string }) =>
        (...args) => {
            const { id } = params;
            const [dispatch] = args;

            const { localStorage } = getLocalStorage();

            dispatch(actions.customProviderDeleted({ id }));

            const persisted = readPersistedProviders(localStorage).filter(
                p => p.id !== id
            );
            writePersistedProviders(localStorage, persisted);
        },
    testCustomProvider:
        (params: { apiBase: string; apiKey: string }) =>
        async (..._args): Promise<AiModel[]> => {
            const { apiBase, apiKey } = params;
            return fetchModels(apiBase, apiKey);
        },
    setCustomProviderSelectedModel:
        (params: { id: string; model: string }) =>
        (...args) => {
            const { id, model } = params;
            const [dispatch] = args;

            const { localStorage } = getLocalStorage();

            dispatch(actions.customProviderSelectedModelSet({ id, model }));

            const persisted = readPersistedProviders(localStorage);
            const entry = persisted.find(p => p.id === id);
            if (entry !== undefined) {
                entry.selectedModel = model;
                writePersistedProviders(localStorage, persisted);
            }
        }
} satisfies Thunks;

export const protectedThunks = {
    initialize:
        () =>
        async (...args) => {
            const [dispatch, , { ai }] = args;

            if (ai === undefined) {
                return;
            }

            const { localStorage } = getLocalStorage();

            dispatch(actions.initializeStart());

            const tokenResult = await ai.getToken();

            if (tokenResult.status !== "success") {
                dispatch(actions.initializeFailed({ cause: tokenResult.status }));
                return;
            }

            const { token } = tokenResult;
            const availableModels = await ai.listModels(token);

            const persisted = readPersistedProviders(localStorage);

            const customProviders: CustomAiProvider[] = persisted.map(p =>
                id<CustomAiProvider>({
                    id: p.id,
                    label: p.label,
                    apiBase: p.apiBase,
                    apiKey: p.apiKey,
                    availableModels: [],
                    selectedModel: p.selectedModel,
                    modelsFetchStatus: "fetching"
                })
            );

            dispatch(
                actions.initializeSucceed({
                    webUiUrl: ai.webUiUrl,
                    apiBase: ai.apiBase,
                    token,
                    availableModels,
                    selectedModel:
                        localStorage.getItem(SELECTED_MODEL_STORAGE_KEY) ?? undefined,
                    customProviders
                })
            );

            await Promise.all(
                persisted.map(async p => {
                    try {
                        const models = await fetchModels(p.apiBase, p.apiKey);
                        dispatch(
                            actions.customProviderModelsLoaded({ id: p.id, models })
                        );
                    } catch {
                        dispatch(actions.customProviderModelsFetchFailed({ id: p.id }));
                    }
                })
            );
        }
} satisfies Thunks;
