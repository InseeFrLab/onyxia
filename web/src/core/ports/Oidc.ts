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
        renewTokens: () => Promise<void>;
        getTokens: () => Promise<Tokens>;
        logout: (params: { redirectTo: "home" | "current page" }) => Promise<never>;
        isNewBrowserSession: boolean;
        subscribeToAutoLogoutCountdown: (
            tickCallback: (params: { secondsLeft: number | undefined }) => void
        ) => { unsubscribeFromAutoLogoutCountdown: () => void };
    };

    export type Tokens = Tokens.WithRefreshToken | Tokens.WithoutRefreshToken;

    export namespace Tokens {
        export type Common = {
            accessToken: string;
            accessTokenExpirationTime: number;
            idToken: string;
            decodedIdToken: Record<string, unknown>;
        };

        export type WithRefreshToken = Common & {
            hasRefreshToken: true;
            refreshToken: string;
            refreshTokenExpirationTime: number | undefined;
        };

        export type WithoutRefreshToken = Common & {
            hasRefreshToken: false;
            refreshToken?: never;
            refreshTokenExpirationTime?: never;
        };
    }
}
