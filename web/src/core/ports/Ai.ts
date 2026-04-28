export type Ai = {
    webUiUrl: string;
    apiBase: string;
    getToken: () => Promise<GetTokenResult>;
    listModels: (token: string) => Promise<string[]>;
};

export type GetTokenResult =
    | { status: "success"; token: string }
    | { status: "no-account" }
    | { status: "error" };
