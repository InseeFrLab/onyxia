
import type { StatefulReadonlyEvt } from "evt";
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

        evtOidcTokens: StatefulReadonlyEvt<OidcTokens>;

        renewOidcTokensIfExpiresSoonOrRedirectToLoginIfAlreadyExpired(): Promise<void>;

        logout(): Promise<never>;

    };


}

export type ParsedOidcAccessToken = {
    idep: string;
    email: string;
};

export function parseOidcAccessToken(
    keycloakClient: Pick<KeycloakClient.LoggedIn, "evtOidcTokens">
): ParsedOidcAccessToken {
    const {
        email, 
        preferred_username 
    } = decodeJwt<{
	gitlab_group: string[] | null;
	preferred_username: string;
	name: string;
	email: string;
    }>(keycloakClient.evtOidcTokens.state.accessToken);

    return { 
        "idep": preferred_username,
        email
    }
}
