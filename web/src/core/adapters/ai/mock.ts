import type { Ai } from "core/ports/Ai";

export function createAi(params: { webUiUrl: string }): Ai {
    const { webUiUrl } = params;

    return {
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
