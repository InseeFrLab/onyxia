export declare type Oidc = Oidc.LoggedIn | Oidc.NotLoggedIn;

export declare namespace Oidc {
    export type Common = {
        params: {
            issuerUri: string;
            clientId: string;
        };
    };

    export type NotLoggedIn = Common & {
        isUserLoggedIn: false;
        login: (params: { doesCurrentHrefRequiresAuth: boolean }) => Promise<never>;
    };

    export type LoggedIn = Common & {
        isUserLoggedIn: true;
        renewTokens(): Promise<void>;
        getTokens: () => Tokens;
        logout: (params: { redirectTo: "home" | "current page" }) => Promise<never>;
        authMethod: "back from auth server" | "session storage" | "silent signin";
        subscribeToAutoLogoutCountdown: (
            tickCallback: (params: { secondsLeft: number | undefined }) => void
        ) => { unsubscribeFromAutoLogoutCountdown: () => void };
    };

    export type Tokens = {
        accessToken: string;
        idToken: string;
        refreshToken: string;
        refreshTokenExpirationTime: number;
        decodedIdToken: Record<string, unknown>;
    };
}
