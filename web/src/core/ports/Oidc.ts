import type { IdTokenClaims } from "oidc-spa/core";
import { OidcInitializationError } from "oidc-spa/core";

export declare type Oidc = Oidc.LoggedIn | Oidc.NotLoggedIn;

export declare namespace Oidc {
    export type Common = {
        issuerUri: string;
        clientId: string;
        validRedirectUri: string;
    };

    export type NotLoggedIn = Common & {
        isUserLoggedIn: false;
        login: (params: { doesCurrentHrefEnforceLogin: boolean }) => Promise<never>;
        initializationError: OidcInitializationError | undefined;
    };

    export type LoggedIn = Common & {
        isUserLoggedIn: true;
        renewTokens: () => Promise<void>;
        getTokens: () => Promise<OidcTokens>;
        logout: (params?: { returnToUrl?: string }) => Promise<never>;
        isNewBrowserSession: boolean;
        subscribeToAutoLogoutState: (
            next: (
                autoLogoutState:
                    | {
                          shouldDisplayWarning: true;
                          secondsLeftBeforeAutoLogout: number;
                          /** Resets the auto-logout countdown as if user activity was detected. */
                          resetAutoLogoutCountdown: () => void;
                      }
                    | {
                          shouldDisplayWarning: false;
                          secondsLeftBeforeAutoLogout?: never;
                      }
            ) => void
        ) => { unsubscribeFromAutoLogoutState: () => void };
    };
}

export type OidcTokens = OidcTokens.WithRefreshToken | OidcTokens.WithoutRefreshToken;

export namespace OidcTokens {
    export type Common = {
        accessToken: string;
        /** Millisecond epoch in the server's time */
        accessTokenExpirationTime: number;
        idToken: string;
        idTokenClaims: IdTokenClaims;
        /** Millisecond epoch in the server's time, read from id_token's JWT, iat claim value */
        issuedAtTime: number;

        /** To use instead of Date.now() if you ever need to tell if a token is expired or not */
        getServerDateNow: () => number;
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
