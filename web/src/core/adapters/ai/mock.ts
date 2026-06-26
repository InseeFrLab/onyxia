import type { Ai } from "core/ports/Ai";

export function createAi(params: {
    id: string;
    name: string;
    provider: string;
    webUiUrl: string;
}): Ai {
    const { id, name, provider, webUiUrl } = params;

    return {
        id,
        name,
        provider,
        webUiUrl,
        apiBase: `${webUiUrl}/api`,
        getToken: async () => ({ status: "success" as const, token: "mock-ai-token" }),
        listModels: async () => [
            { id: "llama3.2", name: "Llama 3.2" },
            { id: "mistral-7b", name: "Mistral 7B" },
            { id: "codestral", name: "Codestral" }
        ]
    };
}
