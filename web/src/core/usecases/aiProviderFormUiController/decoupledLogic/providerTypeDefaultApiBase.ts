import type { AiConfig } from "core/ports/OnyxiaApi/AiConfig";

/** Prefilled when the user picks a provider type, they remain free to change it. */
export const providerTypeDefaultApiBase = {
    "openai-compatible": "",
    openai: "https://api.openai.com/v1",
    anthropic: "https://api.anthropic.com/v1",
    mistral: "https://api.mistral.ai/v1",
    deepseek: "https://api.deepseek.com"
} as const satisfies Record<AiConfig.SupportedAiProviderType, string>;
