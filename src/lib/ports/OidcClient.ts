import type { StatefulReadonlyEvt } from "evt";
import { nonNullable } from "evt";
import * as jwtSimple from "jwt-simple";
import type { KcLanguageTag } from "keycloakify";
import { getEnv } from "env";

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

        evtOidcTokens: StatefulReadonlyEvt<OidcTokens | undefined>;

        /** Returns number of seconds before the tokens expires */
        getOidcTokensRemandingValidityMs(): number;

        /**
         * Renew the token if it has less than minValidity ms left before it expires.
         *
         * @param minValidity — If not specified, 10 000 (10 second) is used.
         */
        renewOidcTokensIfExpiresSoonOrRedirectToLoginIfAlreadyExpired(params?: {
            minValidityMs?: number;
        }): Promise<void>;

        logout(params: { redirectToOrigin: boolean }): Promise<never>;
    };
}

export type ParsedJwt = {
    email: string;
    familyName: string; //Obama
    firstName: string; //Barack
    username: string; //obarack, the idep
    groups: string[];
    kcLanguageTag: KcLanguageTag;
};

export async function parseOidcAccessToken(
    oidcClient: Pick<OidcClient.LoggedIn, "evtOidcTokens">,
): Promise<ParsedJwt> {
    const obj: Record<string, any> = jwtSimple.decode(
        (await oidcClient.evtOidcTokens.waitFor(nonNullable())).accessToken,
        "",
        true,
    );

    const out = {
        "email": obj[getEnv().OIDC_EMAIL_CLAIM] ?? "",
        "familyName": obj[getEnv().OIDC_FAMILY_NAME_CLAIM] ?? "",
        "firstName": obj[getEnv().OIDC_FIRST_NAME_CLAIM] ?? "",
        "username": obj[getEnv().OIDC_USERNAME_CLAIM] ?? "",
        "groups": obj[getEnv().OIDC_GROUPS_CLAIM] ?? [],
        "kcLanguageTag": obj[getEnv().OIDC_LOCALE_CLAIM] ?? "en",
    };

    if (!out.groups) {
        out.groups = [];
    }

    return out;
}

export type ParsedJwt_Legacy = {
    email: string;
    family_name: string; //Obama
    given_name: string; //Barack
    preferred_username: string; //obarack, the idep
    groups: string[];
    locale: KcLanguageTag;
};

export async function parseOidcAccessToken_legacy(
    oidcClient: Pick<
        OidcClient.LoggedIn,
        "evtOidcTokens" | "renewOidcTokensIfExpiresSoonOrRedirectToLoginIfAlreadyExpired"
    >,
): Promise<ParsedJwt_Legacy> {
    const parsedJwt = jwtSimple.decode(
        (await oidcClient.evtOidcTokens.waitFor(nonNullable())).accessToken,
        "",
        true,
    ) as ParsedJwt_Legacy;

    if (!parsedJwt.groups) {
        parsedJwt.groups = [];
    }

    return parsedJwt;
}
