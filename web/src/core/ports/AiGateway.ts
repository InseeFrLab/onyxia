import type { LocalizedString } from "./OnyxiaApi";

export type AiGateway = {
    id: string;
    name: string;
    protocol: string;
    description: LocalizedString | undefined;
    accountCreation: AiGateway.AccountCreation | undefined;
    webUiUrl: string;
    apiBase: string;
    getAccessToken: () => Promise<AiGateway.AccessTokenResult>;
    listModels: (accessToken: string) => Promise<{ id: string; name: string }[]>;
};

export declare namespace AiGateway {
    export type AccountCreation = {
        title: LocalizedString | undefined;
        description: LocalizedString | undefined;
        buttonLabel: LocalizedString | undefined;
    };

    export type AccessTokenResult =
        | { ok: true; accessToken: string }
        | { ok: false; error: AccessTokenError };

    export type AccessTokenError =
        | { kind: "no-account" }
        | { kind: "unexpected"; cause: Error };
}
