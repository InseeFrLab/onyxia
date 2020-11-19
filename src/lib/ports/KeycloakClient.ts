
import type { StatefulReadonlyEvt } from "evt";
import { nonNullable } from "evt";
import decodeJwt from "jwt-decode";


export type OidcTokens = Readonly<{
    accessToken: string;
    idToken: string;
    refreshToken: string;
}>;

export declare type KeycloakClient =
    KeycloakClient.LoggedIn |
    KeycloakClient.NotLoggedIn;

export declare namespace KeycloakClient {

    export type NotLoggedIn = {

        isUserLoggedIn: false;

        login(
            params?: {
                redirectUri: string
            }
        ): Promise<never>;
    };

    export type LoggedIn = {

        isUserLoggedIn: true;

        evtOidcTokens: StatefulReadonlyEvt<OidcTokens | undefined>;

        /**
         * Renew the token if it has less than minValidity seconds left before it expires.
         * 
         * @param minValidity — If not specified, 10 is used.
         */
        renewOidcTokensIfExpiresSoonOrRedirectToLoginIfAlreadyExpired(
            params?: { minValidity?: number; }
        ): Promise<void>;

        logout(): Promise<never>;

    };


}

export type ParsedOidcAccessToken = {
    idep: string;
    email: string;
};

export async function parseOidcAccessToken(
    keycloakClient: Pick<KeycloakClient.LoggedIn, "evtOidcTokens" | "renewOidcTokensIfExpiresSoonOrRedirectToLoginIfAlreadyExpired">
): Promise<ParsedOidcAccessToken> {

    const {
        email,
        preferred_username,
    } = decodeJwt<{
        gitlab_group: string[] | null;
        preferred_username: string;
        name: string;
        email: string;
    }>(
        (await keycloakClient.evtOidcTokens.waitFor(nonNullable())).accessToken
    );

    return {
        "idep": preferred_username,
        email
    };
}
