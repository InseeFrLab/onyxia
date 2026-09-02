import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { symToStr } from "tsafe/symToStr";
import {
    parseAiConfigStr,
    serializeAiConfig,
    type PersistedAiConfig
} from "./persistedAiConfig";

const sampleConfig: PersistedAiConfig = {
    customProviders: [
        {
            id: "p1",
            name: "My provider",
            provider: "openai",
            apiBase: "https://api.openai.com/v1",
            apiKey: "sk-secret"
        },
        {
            id: "p2",
            name: "Mistral AI",
            provider: "mistral",
            apiBase: "https://api.mistral.ai/v1",
            apiKey: "mistral-secret"
        },
        {
            id: "p3",
            name: "Anthropic",
            provider: "anthropic",
            apiBase: "https://api.anthropic.com/v1",
            apiKey: "anthropic-secret"
        }
    ],
    selections: {
        p1: "gpt-4",
        p2: "devstral-small-latest",
        p3: "claude-sonnet-4-6",
        region1: null
    },
    activeProviderId: "p1"
};

describe(symToStr({ parseAiConfigStr }), () => {
    beforeEach(() => {
        vi.spyOn(console, "warn").mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("returns null when nothing is stored", () => {
        expect(parseAiConfigStr({ aiConfigStr: null })).toBeNull();
    });

    it("returns null on invalid JSON", () => {
        expect(parseAiConfigStr({ aiConfigStr: "{not json" })).toBeNull();
    });

    it("returns null when the shape doesn't match", () => {
        expect(
            parseAiConfigStr({ aiConfigStr: JSON.stringify({ customProviders: 42 }) })
        ).toBeNull();
    });

    it("parses a valid config", () => {
        expect(
            parseAiConfigStr({ aiConfigStr: JSON.stringify(sampleConfig) })
        ).toStrictEqual(sampleConfig);
    });

    it("normalizes model selections stored in the previous format", () => {
        const legacyConfig = {
            ...sampleConfig,
            selections: {
                p1: { modelId: "gpt-4" },
                region1: { modelId: null }
            }
        };

        expect(
            parseAiConfigStr({ aiConfigStr: JSON.stringify(legacyConfig) })?.selections
        ).toStrictEqual({
            p1: "gpt-4",
            region1: null
        });
    });

    it("preserves a null model selection", () => {
        const parsed = parseAiConfigStr({ aiConfigStr: JSON.stringify(sampleConfig) });
        expect(parsed?.selections.region1).toBeNull();
    });
});

describe(symToStr({ serializeAiConfig }), () => {
    beforeEach(() => {
        vi.spyOn(console, "warn").mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("round-trips through parseAiConfigStr", () => {
        const aiConfigStr = serializeAiConfig({ aiConfig: sampleConfig });
        expect(parseAiConfigStr({ aiConfigStr })).toStrictEqual(sampleConfig);
    });
});
