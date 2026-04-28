import type { Ai } from "core/ports/Ai";

export function createAi(params: { webUiUrl: string }): Ai {
    const { webUiUrl } = params;

    return {
        webUiUrl,
        apiBase: `${webUiUrl}/api`,
        getToken: async () => ({ status: "success" as const, token: "mock-ai-token" }),
        listModels: async () => ["llama3.2", "mistral-7b", "codestral"]
    };
}
