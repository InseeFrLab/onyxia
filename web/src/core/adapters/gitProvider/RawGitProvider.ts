import type { GitProvider } from "core/ports/GitProvider";

/**
 * What each provider (gitLab.ts, forgejo.ts...) implements: the OAuth endpoints as is,
 * stateless. index.ts adds the popup and the session store to get the port's GitProvider.
 */
export type RawGitProvider = Omit<
    GitProvider,
    "userConnection" | "serviceCredentials"
> & {
    userConnection:
        | ({ method: "oauth" } & RawGitProvider.OAuth)
        | Extract<GitProvider["userConnection"], { method: "personal-access-token" }>;
    serviceCredentials:
        | Exclude<GitProvider["serviceCredentials"], { method: "oauth" }>
        | {
              method: "oauth";
              helperConfig: GitProvider.CredentialHelperConfig;
              /** undefined: the service authorizes itself (device flow, GitHub) */
              authorizeAtLaunch: RawGitProvider.ServiceAuthorization | undefined;
          };
};

export namespace RawGitProvider {
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
        /** Throws GitProviderUnauthorizedError when the refresh token is rejected */
        /** redirectUri: the one of the authorization, GitLab's PKCE refresh sends it again */
        refreshTokens: (params: {
            refreshToken: string;
            redirectUri: string;
        }) => Promise<Tokens>;
        /** Invalidates the grant on the provider, on sign out. undefined: not supported (Forgejo) */
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
         * The refresh token goes to git.providers[].credentials.refreshToken, the service
         * gets its access tokens from it. Issued for the services' OAuth application, the
         * one git-credential-oauth refreshes with.
         */
        exchangeAuthorizationCode: (params: {
            code: string;
            codeVerifier: string;
            redirectUri: string;
        }) => Promise<GitProvider.ServiceTokens>;
    };
}
