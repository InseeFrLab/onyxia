import { describe, expect, it } from "vitest";
import { symToStr } from "tsafe/symToStr";
import { resolveApiBaseOnProviderChange } from "./resolveApiBaseOnProviderChange";

describe(symToStr({ resolveApiBaseOnProviderChange }), () => {
    it("uses the selected provider default when the field is empty", () => {
        expect(
            resolveApiBaseOnProviderChange({
                currentApiBase: "",
                nextProvider: "mistral"
            })
        ).toBe("https://api.mistral.ai/v1");
    });

    it("replaces another provider default", () => {
        expect(
            resolveApiBaseOnProviderChange({
                currentApiBase: "https://api.openai.com/v1",
                nextProvider: "anthropic"
            })
        ).toBe("https://api.anthropic.com/v1");
    });

    it("preserves a custom API base", () => {
        expect(
            resolveApiBaseOnProviderChange({
                currentApiBase: " https://llm.example.test/v1 ",
                nextProvider: "openai"
            })
        ).toBe(" https://llm.example.test/v1 ");
    });

    it("clears the field for an OpenAI-compatible provider", () => {
        expect(
            resolveApiBaseOnProviderChange({
                currentApiBase: "https://api.mistral.ai/v1",
                nextProvider: "openai-compatible"
            })
        ).toBe("");
    });
});
