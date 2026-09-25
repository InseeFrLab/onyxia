import { describe, it, expect } from "vitest";
import { symToStr } from "tsafe/symToStr";
import type { AiConfig } from "core/ports/OnyxiaApi/AiConfig";
import {
    createAiProviders,
    createAiProvidersWithRuntime,
    getDefaultModel,
    parseModel,
    type AiProviderWithRuntime,
    type AiProviderRuntime
} from "./aiProviders";
import {
    createEmptyPersistedAiConfig,
    type PersistedAiConfig
} from "./persistedAiConfig";

function createAiConfig(providers: AiConfig.Provider[]): AiConfig {
    return {
        disable: false,
        disallowUserToAddProviders: false,
        description: undefined,
        providers
    };
}

function createConfiguredProvider(
    params: Partial<AiConfig.Provider> & { name: string }
): AiConfig.Provider {
    return {
        providerType: "openai-compatible",
        apiBase: "https://corporate.example.com/v1",
        documentation: undefined,
        logoUrl: undefined,
        authentification: { type: "none" },
        models: undefined,
        ...params
    };
}

const loadedModels: AiProviderRuntime["models"] = {
    stateDescription: "loaded",
    availableModels: [{ id: "gpt-5" }, { id: "meta-llama/Llama-3" }]
};

function createProviders(
    params: Parameters<typeof createAiProviders>[0] & {
        runtimeByProviderName: Record<string, AiProviderRuntime>;
    }
) {
    const { runtimeByProviderName, ...providerParams } = params;
    const persistedAiConfig = providerParams.persistedAiConfig;
    return createAiProvidersWithRuntime({
        aiProviders: createAiProviders(providerParams),
        runtimeByProviderName,
        persistedAiConfig
    });
}

describe(symToStr({ createAiProviders }), () => {
    it("needs no fetch when the instance config pins the model list", () => {
        const [aiProvider] = createProviders({
            aiConfig: createAiConfig([
                createConfiguredProvider({ name: "Corporate", models: ["gpt-5"] })
            ]),
            persistedAiConfig: createEmptyPersistedAiConfig(),
            runtimeByProviderName: {}
        });

        expect(aiProvider.models).toStrictEqual({
            stateDescription: "loaded",
            availableModels: [{ id: "gpt-5" }]
        });
    });

    it("considers a provider that expects no key as authenticated by definition", () => {
        const [aiProvider] = createProviders({
            aiConfig: createAiConfig([createConfiguredProvider({ name: "Corporate" })]),
            persistedAiConfig: createEmptyPersistedAiConfig(),
            runtimeByProviderName: {}
        });

        expect(aiProvider.auth).toStrictEqual({ stateDescription: "not required" });
    });

    it("reflects the runtime for a provider that has a key to obtain", () => {
        const [aiProvider] = createProviders({
            aiConfig: createAiConfig([
                createConfiguredProvider({
                    name: "Corporate",
                    authentification: {
                        type: "api-key",
                        obtentionMethod: "user-provided"
                    }
                })
            ]),
            persistedAiConfig: createEmptyPersistedAiConfig(),
            runtimeByProviderName: {
                Corporate: {
                    auth: { stateDescription: "authenticated", apiKey: "a key" },
                    models: { stateDescription: "not loaded" }
                }
            }
        });

        expect(aiProvider.auth).toStrictEqual({
            stateDescription: "authenticated",
            apiKey: "a key"
        });
    });

    it("authenticates a user created provider with the key it was created with", () => {
        const persistedAiConfig: PersistedAiConfig = {
            ...createEmptyPersistedAiConfig(),
            customProviders: [
                {
                    name: "My LLM",
                    providerType: "mistral",
                    apiBase: "https://api.mistral.ai/v1"
                }
            ],
            apiKeyByProviderName: { "My LLM": "key of my llm" }
        };

        const [aiProvider] = createProviders({
            aiConfig: createAiConfig([]),
            persistedAiConfig,
            runtimeByProviderName: {}
        });

        expect(aiProvider.auth).toStrictEqual({
            stateDescription: "authenticated",
            apiKey: "key of my llm"
        });
    });

    it("expects no authentication from a user created provider without a key", () => {
        const [aiProvider] = createProviders({
            aiConfig: createAiConfig([]),
            persistedAiConfig: {
                ...createEmptyPersistedAiConfig(),
                customProviders: [
                    {
                        name: "My LLM",
                        providerType: "openai-compatible",
                        apiBase: "https://llm.example.com/v1"
                    }
                ]
            },
            runtimeByProviderName: {}
        });

        expect(aiProvider.auth).toStrictEqual({ stateDescription: "not required" });
    });

    it("selects the exposed models the user didn't exclude", () => {
        const [aiProvider] = createProviders({
            aiConfig: createAiConfig([createConfiguredProvider({ name: "Corporate" })]),
            persistedAiConfig: {
                ...createEmptyPersistedAiConfig(),
                excludedModelIdsByProviderName: {
                    Corporate: ["meta-llama/Llama-3", "a model that is gone"]
                }
            },
            runtimeByProviderName: {
                Corporate: {
                    auth: { stateDescription: "not loaded" },
                    models: loadedModels
                }
            }
        });

        expect(aiProvider.selectedModelIds).toStrictEqual(["gpt-5"]);
    });

    it("selects every model of a provider the user never filtered", () => {
        const [aiProvider] = createProviders({
            aiConfig: createAiConfig([createConfiguredProvider({ name: "Corporate" })]),
            persistedAiConfig: createEmptyPersistedAiConfig(),
            runtimeByProviderName: {
                Corporate: {
                    auth: { stateDescription: "not loaded" },
                    models: loadedModels
                }
            }
        });

        expect(aiProvider.selectedModelIds).toStrictEqual([
            "gpt-5",
            "meta-llama/Llama-3"
        ]);
    });

    it("selects the models a provider starts exposing after the user filtered", () => {
        const [aiProvider] = createProviders({
            aiConfig: createAiConfig([createConfiguredProvider({ name: "Corporate" })]),
            persistedAiConfig: {
                ...createEmptyPersistedAiConfig(),
                excludedModelIdsByProviderName: { Corporate: ["gpt-5"] }
            },
            runtimeByProviderName: {
                Corporate: {
                    auth: { stateDescription: "not loaded" },
                    models: {
                        stateDescription: "loaded",
                        availableModels: [
                            { id: "gpt-5" },
                            { id: "meta-llama/Llama-3" },
                            { id: "a new model" }
                        ]
                    }
                }
            }
        });

        expect(aiProvider.selectedModelIds).toStrictEqual([
            "meta-llama/Llama-3",
            "a new model"
        ]);
    });

    it("selects nothing while the models are being fetched", () => {
        const [aiProvider] = createProviders({
            aiConfig: createAiConfig([createConfiguredProvider({ name: "Corporate" })]),
            persistedAiConfig: createEmptyPersistedAiConfig(),
            runtimeByProviderName: {
                Corporate: {
                    auth: { stateDescription: "not loaded" },
                    models: { stateDescription: "fetching" }
                }
            }
        });

        expect(aiProvider.selectedModelIds).toStrictEqual([]);
    });

    it("flags a user created provider whose name the admin later took", () => {
        const aiProviders = createProviders({
            aiConfig: createAiConfig([createConfiguredProvider({ name: "Corporate" })]),
            persistedAiConfig: {
                ...createEmptyPersistedAiConfig(),
                customProviders: [
                    {
                        name: "Corporate",
                        providerType: "openai",
                        apiBase: "https://api.openai.com/v1"
                    },
                    {
                        name: "My LLM",
                        providerType: "openai",
                        apiBase: "https://api.openai.com/v1"
                    }
                ]
            },
            runtimeByProviderName: {}
        });

        const got = aiProviders
            .filter(aiProvider => aiProvider.origin === "created by user")
            .map(aiProvider => ({
                name: aiProvider.name,
                isNameConflicting: aiProvider.isNameConflicting
            }));

        expect(got).toStrictEqual([
            { name: "Corporate", isNameConflicting: true },
            { name: "My LLM", isNameConflicting: false }
        ]);
    });

    it("lists the admin configured providers before the user created ones", () => {
        const aiProviders = createProviders({
            aiConfig: createAiConfig([createConfiguredProvider({ name: "Corporate" })]),
            persistedAiConfig: {
                ...createEmptyPersistedAiConfig(),
                customProviders: [
                    {
                        name: "My LLM",
                        providerType: "openai",
                        apiBase: "https://api.openai.com/v1"
                    }
                ]
            },
            runtimeByProviderName: {}
        });

        expect(aiProviders.map(aiProvider => aiProvider.origin)).toStrictEqual([
            "configured by admin",
            "created by user"
        ]);
    });
});

describe(symToStr({ getDefaultModel }), () => {
    const aiProviders: AiProviderWithRuntime[] = [
        {
            origin: "configured by admin",
            name: "Corporate",
            providerType: "openai-compatible",
            apiBase: "https://corporate.example.com/v1",
            documentation: undefined,
            logoUrl: undefined,
            authentification: { type: "none" },
            modelIds: undefined,
            auth: { stateDescription: "not required" },
            models: loadedModels,
            modelsListing: loadedModels,
            selectedModelIds: ["gpt-5"]
        },
        {
            origin: "created by user",
            name: "My LLM",
            providerType: "openai",
            apiBase: "https://api.openai.com/v1",
            isNameConflicting: false,
            auth: { stateDescription: "not required" },
            models: loadedModels,
            modelsListing: loadedModels,
            selectedModelIds: ["meta-llama/Llama-3"]
        }
    ];

    it("falls back to the first selected model when the user elected none", () => {
        expect(
            getDefaultModel({ aiProviders, defaultModel_persisted: null })
        ).toStrictEqual({ providerName: "Corporate", modelId: "gpt-5" });
    });

    it("returns undefined when no model is selected at all", () => {
        expect(
            getDefaultModel({
                aiProviders: aiProviders.map(aiProvider => ({
                    ...aiProvider,
                    selectedModelIds: []
                })),
                defaultModel_persisted: null
            })
        ).toBe(undefined);
    });

    it("returns the elected model when it is still selected", () => {
        const defaultModel_persisted = { providerName: "Corporate", modelId: "gpt-5" };

        expect(getDefaultModel({ aiProviders, defaultModel_persisted })).toStrictEqual(
            defaultModel_persisted
        );
    });

    it("falls back to the first selected model when the elected one no longer is", () => {
        expect(
            getDefaultModel({
                aiProviders,
                defaultModel_persisted: {
                    providerName: "Corporate",
                    modelId: "meta-llama/Llama-3"
                }
            })
        ).toStrictEqual({ providerName: "Corporate", modelId: "gpt-5" });
    });

    it("falls back to the first selected model when its provider is gone", () => {
        expect(
            getDefaultModel({
                aiProviders,
                defaultModel_persisted: { providerName: "Gone", modelId: "gpt-5" }
            })
        ).toStrictEqual({ providerName: "Corporate", modelId: "gpt-5" });
    });
});

describe(symToStr({ parseModel }), () => {
    it("splits at the first separator, a model id may contain one", () => {
        expect(parseModel({ model: "Corporate/meta-llama/Llama-3" })).toStrictEqual({
            providerName: "Corporate",
            modelId: "meta-llama/Llama-3"
        });
    });

    it("returns undefined when there is no separator", () => {
        expect(parseModel({ model: "Corporate" })).toBe(undefined);
    });

    it("returns undefined when either side is empty", () => {
        expect(parseModel({ model: "/gpt-5" })).toBe(undefined);
        expect(parseModel({ model: "Corporate/" })).toBe(undefined);
    });
});
