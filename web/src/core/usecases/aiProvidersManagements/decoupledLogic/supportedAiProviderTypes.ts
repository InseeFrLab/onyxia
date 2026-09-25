import { assert, type Equals } from "tsafe";
import type { AiConfig } from "core/ports/OnyxiaApi/AiConfig";

export const supportedAiProviderTypes = [
    "openai-compatible",
    "openai",
    "anthropic",
    "mistral",
    "deepseek"
] as const;

// The instance config is the source of truth, this array only mirrors it so that the
// value can be enumerated (zod schema, provider creation form).
assert<
    Equals<(typeof supportedAiProviderTypes)[number], AiConfig.SupportedAiProviderType>
>();
