export type OidcTokens = Readonly<{
    accessToken: string;
    idToken: string;
    refreshToken: string;
}>;

export declare type OidcClient = OidcClient.LoggedIn | OidcClient.NotLoggedIn;

export declare namespace OidcClient {
    export type NotLoggedIn = {
        isUserLoggedIn: false;
        login(): Promise<never>;
    };

    export type LoggedIn = {
        isUserLoggedIn: true;
        getAccessToken(): Promise<string>;
        logout: (params: { redirectTo: "home" | "current page" }) => Promise<never>;
    };
}
