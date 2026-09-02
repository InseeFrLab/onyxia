export const customProviderProtocolDefaultApiBase = {
    openai: "https://api.openai.com/v1",
    "openai-compatible": "",
    mistral: "https://api.mistral.ai/v1",
    anthropic: "https://api.anthropic.com/v1"
} as const;

export type CustomProviderProtocol = keyof typeof customProviderProtocolDefaultApiBase;

export const customProviderProtocols = Object.keys(
    customProviderProtocolDefaultApiBase
) as CustomProviderProtocol[];
