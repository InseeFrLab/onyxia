import { describe, it, expect } from "vitest";
import { symToStr } from "tsafe/symToStr";
import type { AiConfig } from "core/ports/OnyxiaApi/AiConfig";
import {
    createAiProviders,
    getDefaultModel,
    parseModel,
    type AiProvider,
    type ProviderRuntime
} from "./aiProviders";
import {
    createEmptyPersistedAiConfig,
    type PersistedAiConfig
} from "./persistedAiConfig";

function createAiConfig(providers: AiConfig.Provider[]): AiConfig {
    return {
        disable: false,
        disallowUserToAddProviders: false,
        providers
    };
}

function createConfiguredProvider(
    params: Partial<AiConfig.Provider> & { name: string }
): AiConfig.Provider {
    return {
        providerType: "openai-compatible",
        apiBase: "https://corporate.example.com/v1",
        description: undefined,
        authentification: { type: "none" },
        models: undefined,
        ...params
    };
}

const loadedModels: ProviderRuntime["models"] = {
    stateDescription: "loaded",
    availableModels: [{ id: "gpt-5" }, { id: "meta-llama/Llama-3" }]
};

describe(symToStr({ createAiProviders }), () => {
    it("needs no fetch when the instance config pins the model list", () => {
        const [aiProvider] = createAiProviders({
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
        const [aiProvider] = createAiProviders({
            aiConfig: createAiConfig([createConfiguredProvider({ name: "Corporate" })]),
            persistedAiConfig: createEmptyPersistedAiConfig(),
            runtimeByProviderName: {}
        });

        expect(aiProvider.auth).toStrictEqual({ stateDescription: "not required" });
    });

    it("reflects the runtime for a provider that has a key to obtain", () => {
        const [aiProvider] = createAiProviders({
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

        const [aiProvider] = createAiProviders({
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
        const [aiProvider] = createAiProviders({
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

    it("filters the selection against what the provider actually exposes", () => {
        const [aiProvider] = createAiProviders({
            aiConfig: createAiConfig([createConfiguredProvider({ name: "Corporate" })]),
            persistedAiConfig: {
                ...createEmptyPersistedAiConfig(),
                selectedModelIdsByProviderName: {
                    Corporate: ["gpt-5", "a model that is gone"]
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

    it("preserves the selection while the models are being fetched", () => {
        const [aiProvider] = createAiProviders({
            aiConfig: createAiConfig([createConfiguredProvider({ name: "Corporate" })]),
            persistedAiConfig: {
                ...createEmptyPersistedAiConfig(),
                selectedModelIdsByProviderName: { Corporate: ["gpt-5"] }
            },
            runtimeByProviderName: {
                Corporate: {
                    auth: { stateDescription: "not loaded" },
                    models: { stateDescription: "fetching" }
                }
            }
        });

        expect(aiProvider.selectedModelIds).toStrictEqual(["gpt-5"]);
    });

    it("flags a user created provider whose name the admin later took", () => {
        const aiProviders = createAiProviders({
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
        const aiProviders = createAiProviders({
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
    const aiProviders: AiProvider[] = [
        {
            origin: "configured by admin",
            name: "Corporate",
            providerType: "openai-compatible",
            apiBase: "https://corporate.example.com/v1",
            description: undefined,
            authentification: { type: "none" },
            auth: { stateDescription: "not required" },
            models: loadedModels,
            selectedModelIds: ["gpt-5"]
        }
    ];

    it("returns undefined when the user elected none", () => {
        expect(getDefaultModel({ aiProviders, defaultModel_persisted: null })).toBe(
            undefined
        );
    });

    it("returns the elected model when it is still selected", () => {
        const defaultModel_persisted = { providerName: "Corporate", modelId: "gpt-5" };

        expect(getDefaultModel({ aiProviders, defaultModel_persisted })).toStrictEqual(
            defaultModel_persisted
        );
    });

    it("returns undefined when the elected model is no longer selected", () => {
        expect(
            getDefaultModel({
                aiProviders,
                defaultModel_persisted: {
                    providerName: "Corporate",
                    modelId: "meta-llama/Llama-3"
                }
            })
        ).toBe(undefined);
    });

    it("returns undefined when the provider it belonged to is gone", () => {
        expect(
            getDefaultModel({
                aiProviders,
                defaultModel_persisted: { providerName: "Gone", modelId: "gpt-5" }
            })
        ).toBe(undefined);
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
