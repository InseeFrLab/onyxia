export type Ai = {
    id: string;
    name: string;
    /**
     * LLM provider family the endpoint speaks (e.g. "openai", "anthropic", "gemini").
     * Injected as `ai.provider` in the service launch context so charts know which
     * API dialect to use. Defaults to "openai" (OpenAI-compatible) for region gateways.
     */
    provider: string;
    webUiUrl: string;
    apiBase: string;
    getToken: () => Promise<GetTokenResult>;
    listModels: (token: string) => Promise<{ id: string; name: string }[]>;
};

export type GetTokenResult =
    | { status: "success"; token: string }
    | { status: "no-account" }
    | { status: "error" };
