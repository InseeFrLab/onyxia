import { describe, it, expect } from "vitest";
import { symToStr } from "tsafe/symToStr";
import {
    parseAiConfigStr,
    removeProviderFromPersistedAiConfig,
    renameProviderInPersistedAiConfig,
    serializeAiConfig,
    type PersistedAiConfig
} from "./persistedAiConfig";

const aiConfig: PersistedAiConfig = {
    customProviders: [
        {
            name: "My LLM",
            providerType: "openai-compatible",
            apiBase: "https://llm.example.com/v1"
        }
    ],
    apiKeyByProviderName: { "My LLM": "key of my llm", Corporate: "key of corporate" },
    excludedModelIdsByProviderName: {
        "My LLM": ["mistral-small", "mistral-large"],
        Corporate: ["gpt-5"]
    },
    defaultModel: { providerName: "My LLM", modelId: "mistral-small" }
};

describe(symToStr({ parseAiConfigStr }), () => {
    it("round trips through serialization", () => {
        const got = parseAiConfigStr({
            aiConfigStr: serializeAiConfig({ aiConfig })
        });

        expect(got).toStrictEqual(aiConfig);
    });

    it("returns undefined when nothing was ever saved", () => {
        expect(parseAiConfigStr({ aiConfigStr: null })).toBe(undefined);
    });

    it("returns undefined instead of throwing when what is stored is not JSON", () => {
        expect(parseAiConfigStr({ aiConfigStr: "{ not json" })).toBe(undefined);
    });

    it("returns undefined when what is stored has the wrong shape", () => {
        expect(
            parseAiConfigStr({
                aiConfigStr: JSON.stringify({ ...aiConfig, customProviders: "nope" })
            })
        ).toBe(undefined);
    });

    it("returns undefined when a provider type we don't support is stored", () => {
        expect(
            parseAiConfigStr({
                aiConfigStr: JSON.stringify({
                    ...aiConfig,
                    customProviders: [
                        {
                            name: "My LLM",
                            providerType: "not-a-provider-type",
                            apiBase: "https://llm.example.com/v1"
                        }
                    ]
                })
            })
        ).toBe(undefined);
    });
});

describe(symToStr({ renameProviderInPersistedAiConfig }), () => {
    it("moves every entry that refers to the provider, and only those", () => {
        const got = renameProviderInPersistedAiConfig({
            aiConfig,
            providerName_current: "My LLM",
            providerName_new: "My renamed LLM"
        });

        const expected: PersistedAiConfig = {
            customProviders: [
                {
                    name: "My renamed LLM",
                    providerType: "openai-compatible",
                    apiBase: "https://llm.example.com/v1"
                }
            ],
            apiKeyByProviderName: {
                "My renamed LLM": "key of my llm",
                Corporate: "key of corporate"
            },
            excludedModelIdsByProviderName: {
                "My renamed LLM": ["mistral-small", "mistral-large"],
                Corporate: ["gpt-5"]
            },
            defaultModel: { providerName: "My renamed LLM", modelId: "mistral-small" }
        };

        expect(got).toStrictEqual(expected);
    });

    it("is a no op when the name doesn't change", () => {
        const got = renameProviderInPersistedAiConfig({
            aiConfig,
            providerName_current: "My LLM",
            providerName_new: "My LLM"
        });

        expect(got).toStrictEqual(aiConfig);
    });

    it("leaves the default model alone when it belongs to another provider", () => {
        const got = renameProviderInPersistedAiConfig({
            aiConfig,
            providerName_current: "Corporate",
            providerName_new: "Corporate LLM"
        });

        expect(got.defaultModel).toStrictEqual({
            providerName: "My LLM",
            modelId: "mistral-small"
        });
    });
});

describe(symToStr({ removeProviderFromPersistedAiConfig }), () => {
    it("leaves no orphan entry behind", () => {
        const got = removeProviderFromPersistedAiConfig({
            aiConfig,
            providerName: "My LLM"
        });

        const expected: PersistedAiConfig = {
            customProviders: [],
            apiKeyByProviderName: { Corporate: "key of corporate" },
            excludedModelIdsByProviderName: { Corporate: ["gpt-5"] },
            defaultModel: null
        };

        expect(got).toStrictEqual(expected);
    });

    it("keeps the default model when it belongs to another provider", () => {
        const got = removeProviderFromPersistedAiConfig({
            aiConfig,
            providerName: "Corporate"
        });

        expect(got.defaultModel).toStrictEqual({
            providerName: "My LLM",
            modelId: "mistral-small"
        });
    });
});
