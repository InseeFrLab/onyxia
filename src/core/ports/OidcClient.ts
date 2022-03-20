export declare type OidcClient = OidcClient.LoggedIn | OidcClient.NotLoggedIn;

export declare namespace OidcClient {
    export type NotLoggedIn = {
        isUserLoggedIn: false;
        login: () => Promise<never>;
    };

    export type LoggedIn = {
        isUserLoggedIn: true;
        //NOTE: It changes when renewed, don't store it.
        accessToken: string;
        logout: (params: { redirectTo: "home" | "current page" }) => Promise<never>;
    };
}
