import type { GitForge } from "core/ports/GitForge";

/**
 * What each forge (gitLab.ts, forgejo.ts...) implements: the OAuth endpoints as is,
 * stateless. index.ts adds the popup and the session store to get the port's GitForge.
 */
export type RawGitForge = Omit<GitForge, "userConnection" | "serviceCredentials"> & {
    userConnection:
        | ({ method: "oauth" } & RawGitForge.OAuth)
        | Extract<GitForge["userConnection"], { method: "personal-access-token" }>;
    serviceCredentials:
        | Exclude<GitForge["serviceCredentials"], { method: "oauth" }>
        | {
              method: "oauth";
              helperConfig: GitForge.CredentialHelperConfig;
              /** The service is authorized when the user clicks "Launch" (popup) */
              authorizeAtLaunch: RawGitForge.ServiceAuthorization;
          };
};

export namespace RawGitForge {
    /** OAuth 2.0 authorization code + PKCE (public client) */
    export type OAuth = {
        getAuthorizationUrl: (params: {
            redirectUri: string;
            state: string;
            codeChallenge: string;
        }) => string;
        exchangeAuthorizationCode: (params: {
            code: string;
            codeVerifier: string;
            redirectUri: string;
        }) => Promise<Tokens>;
        /** Throws GitForgeUnauthorizedError when the refresh token is rejected */
        /** redirectUri: the one of the authorization, GitLab's PKCE refresh sends it again */
        refreshTokens: (params: {
            refreshToken: string;
            redirectUri: string;
        }) => Promise<Tokens>;
        /** Invalidates the grant on the forge, on sign out. undefined: not supported (Forgejo) */
        revokeTokens: ((params: { refreshToken: string }) => Promise<void>) | undefined;
        /** Where the user revokes the grant themselves when revokeTokens is undefined */
        authorizedApplicationsUrl: string;
    };

    export type Tokens = {
        accessToken: string;
        refreshToken: string | undefined;
        /** Unix time in ms */
        expirationTime: number;
    };

    /** Onyxia only authorizes and exchanges the code, the service refreshes */
    export type ServiceAuthorization = {
        getAuthorizationUrl: (params: {
            redirectUri: string;
            state: string;
            codeChallenge: string;
        }) => string;
        /**
         * The refresh token goes to git.forges[].credentials.refreshToken, the service
         * gets its access tokens from it. Issued for the services' OAuth application, the
         * one git-credential-oauth refreshes with.
         */
        exchangeAuthorizationCode: (params: {
            code: string;
            codeVerifier: string;
            redirectUri: string;
        }) => Promise<GitForge.ServiceTokens>;
    };
}
