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
        p1: { modelId: "gpt-4" },
        p2: { modelId: "devstral-small-latest" },
        p3: { modelId: "claude-sonnet-4-6" },
        region1: { modelId: null }
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

    it("preserves a null modelId selection", () => {
        const parsed = parseAiConfigStr({ aiConfigStr: JSON.stringify(sampleConfig) });
        expect(parsed?.selections.region1).toStrictEqual({ modelId: null });
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
