import { describe, it, expect } from "vitest";
import { symToStr } from "tsafe/symToStr";
import { createAiContext } from "./aiContext";
import type { AiProviderWithRuntime } from "./aiProviders";

function createConfiguredAiProvider(
    params: Partial<
        Omit<Extract<AiProviderWithRuntime, { origin: "configured by admin" }>, "origin">
    > & { name: string }
): Extract<AiProviderWithRuntime, { origin: "configured by admin" }> {
    return {
        origin: "configured by admin",
        providerType: "openai-compatible",
        apiBase: "https://corporate.example.com/v1",
        description: undefined,
        authentification: { type: "none" },
        modelIds: undefined,
        auth: { stateDescription: "not required" },
        models: { stateDescription: "loaded", availableModels: [] },
        selectedModelIds: [],
        ...params
    };
}

function createUserAiProvider(
    params: Partial<
        Omit<Extract<AiProviderWithRuntime, { origin: "created by user" }>, "origin">
    > & { name: string }
): Extract<AiProviderWithRuntime, { origin: "created by user" }> {
    return {
        origin: "created by user",
        providerType: "mistral",
        apiBase: "https://api.mistral.ai/v1",
        isNameConflicting: false,
        auth: { stateDescription: "authenticated", apiKey: "key of my llm" },
        models: { stateDescription: "loaded", availableModels: [] },
        selectedModelIds: [],
        ...params
    };
}

describe(symToStr({ createAiContext }), () => {
    it("exposes the models the user ticked, prefixed by the provider name", () => {
        const got = createAiContext({
            aiProviders: [
                createConfiguredAiProvider({
                    name: "Corporate",
                    selectedModelIds: ["gpt-5", "meta-llama/Llama-3"]
                })
            ],
            defaultModel: undefined
        });

        expect(got).toStrictEqual({
            enabled: true,
            models: ["Corporate/gpt-5", "Corporate/meta-llama/Llama-3"],
            defaultModel: undefined,
            providers: [
                {
                    name: "Corporate",
                    apiBase: "https://corporate.example.com/v1",
                    apiKey: undefined,
                    models: ["gpt-5", "meta-llama/Llama-3"],
                    type: "openai-compatible"
                }
            ]
        });
    });

    it("carries the API key of an authenticated provider", () => {
        const got = createAiContext({
            aiProviders: [
                createUserAiProvider({ name: "My LLM", selectedModelIds: ["mistral"] })
            ],
            defaultModel: undefined
        });

        expect(got.providers).toStrictEqual([
            {
                name: "My LLM",
                apiBase: "https://api.mistral.ai/v1",
                apiKey: "key of my llm",
                models: ["mistral"],
                type: "mistral"
            }
        ]);
    });

    it("is disabled when the user ticked nothing", () => {
        const got = createAiContext({
            aiProviders: [createConfiguredAiProvider({ name: "Corporate" })],
            defaultModel: undefined
        });

        expect(got.enabled).toBe(false);
        expect(got.providers).toStrictEqual([]);
    });

    it("leaves out the providers we couldn't authenticate", () => {
        const got = createAiContext({
            aiProviders: [
                createConfiguredAiProvider({
                    name: "Needs a key",
                    auth: { stateDescription: "api-key not provided" },
                    selectedModelIds: ["gpt-5"]
                }),
                createConfiguredAiProvider({
                    name: "Broken",
                    auth: { stateDescription: "error" },
                    selectedModelIds: ["gpt-5"]
                })
            ],
            defaultModel: undefined
        });

        expect(got.enabled).toBe(false);
        expect(got.models).toStrictEqual([]);
    });

    it("leaves out a user created provider whose name the admin took", () => {
        const got = createAiContext({
            aiProviders: [
                createConfiguredAiProvider({
                    name: "Corporate",
                    selectedModelIds: ["gpt-5"]
                }),
                createUserAiProvider({
                    name: "Corporate",
                    isNameConflicting: true,
                    selectedModelIds: ["mistral"]
                })
            ],
            defaultModel: undefined
        });

        expect(got.models).toStrictEqual(["Corporate/gpt-5"]);
    });

    it("flattens the default model", () => {
        const got = createAiContext({
            aiProviders: [
                createConfiguredAiProvider({
                    name: "Corporate",
                    selectedModelIds: ["gpt-5"]
                })
            ],
            defaultModel: { providerName: "Corporate", modelId: "gpt-5" }
        });

        expect(got.defaultModel).toBe("Corporate/gpt-5");
    });

    it("drops a default model that isn't exposed", () => {
        const got = createAiContext({
            aiProviders: [
                createConfiguredAiProvider({
                    name: "Needs a key",
                    auth: { stateDescription: "api-key not provided" },
                    selectedModelIds: ["gpt-5"]
                })
            ],
            defaultModel: { providerName: "Needs a key", modelId: "gpt-5" }
        });

        expect(got.defaultModel).toBe(undefined);
    });
});
