export type Ai = {
    id: string;
    name: string;
    webUiUrl: string;
    apiBase: string;
    getToken: () => Promise<GetTokenResult>;
    listModels: (token: string) => Promise<{ id: string; name: string }[]>;
};

export type GetTokenResult =
    | { status: "success"; token: string }
    | { status: "no-account" }
    | { status: "error" };
