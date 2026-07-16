export const customProviderProtocolDefaultApiBase = {
    openai: "https://api.openai.com/v1",
    "openai-compatible": "",
    mistral: "https://api.mistral.ai/v1",
    anthropic: "https://api.anthropic.com/v1"
} as const;

type CustomProviderProtocol = keyof typeof customProviderProtocolDefaultApiBase;

export const customProviderProtocols = Object.keys(
    customProviderProtocolDefaultApiBase
) as CustomProviderProtocol[];

export function isCustomProviderProtocol(value: string): value is CustomProviderProtocol {
    return Object.prototype.hasOwnProperty.call(
        customProviderProtocolDefaultApiBase,
        value
    );
}

export function resolveApiBaseOnProviderChange(params: {
    currentApiBase: string;
    nextProvider: CustomProviderProtocol;
}): string {
    const { currentApiBase, nextProvider } = params;

    const currentApiBaseTrimmed = currentApiBase.trim();

    const isUsingProviderDefaultApiBase = Object.values(
        customProviderProtocolDefaultApiBase
    ).some(defaultApiBase => defaultApiBase === currentApiBaseTrimmed);

    if (currentApiBaseTrimmed !== "" && !isUsingProviderDefaultApiBase) {
        return currentApiBase;
    }

    return customProviderProtocolDefaultApiBase[nextProvider];
}
