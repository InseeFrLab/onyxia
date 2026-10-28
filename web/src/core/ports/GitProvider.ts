/**
 * A Git hosting service (GitLab, Forgejo, GitHub, Bitbucket), one instance per configured
 * provider. What the use cases do with it: connect the user, act on their behalf, give
 * the services their credentials at launch. The rest (id, url, displayName, lifetimes) is
 * in the configuration.
 *
 * Stateless: tokens are passed in, an OAuth access token or a personal access token,
 * the API is the same.
 */
export type GitProvider = {
    /** Account → Git: how the user connects Onyxia to the provider */
    userConnection:
        | ({ method: "oauth" } & GitProvider.OAuth)
        | {
              method: "personal-access-token";
              /** Scopes prefilled when the provider allows it */
              tokenCreationUrl: string;
          };

    // API on behalf of the user (OAuth access token or PAT).
    // Throw GitProviderUnauthorizedError when the token is rejected.
    getUser: (params: { accessToken: string }) => Promise<GitUser>;
    /** Most recently active first */
    listRepositories: (params: {
        accessToken: string;
        search: string;
        page: number;
        signal?: AbortSignal;
    }) => Promise<{ repositories: GitRepository[]; hasNextPage: boolean }>;
    /**
     * The branches of a repository, filtered on search (a name containing it), at most
     * BRANCHES_LIMIT. repositoryFullPath: e.g. "my-group/my-project".
     */
    listBranches: (params: {
        accessToken: string;
        repositoryFullPath: string;
        search: string;
        signal?: AbortSignal;
    }) => Promise<{ branches: string[] }>;
    /** Paired with any of the user's tokens for git over HTTPS */
    getGitUsername: (params: { user: GitUser }) => string;

    /** Launch: what the service gets to clone and push */
    serviceCredentials:
        | {
              /** The user's PAT, as is */
              method: "user-token";
          }
        | {
              /** A token created for the service, on all the user's repositories */
              method: "scoped-token";
              /** accessToken: the user's OAuth access token or PAT (scope api) */
              createToken: (params: {
                  accessToken: string;
                  name: string;
                  /** Unix time in ms */
                  expirationTime: number;
              }) => Promise<{ token: string }>;
          }
        | {
              method: "oauth";
              helperConfig: GitProvider.CredentialHelperConfig;
              /** undefined: the service authorizes itself (device flow, GitHub) */
              authorizeAtLaunch: GitProvider.ServiceAuthorization | undefined;
          };
};

export namespace GitProvider {
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
        }) => Promise<{
            accessToken: string;
            refreshToken: string;
            expirationTime: number;
        }>;
    };

    /** What git-credential-oauth needs in the service */
    export type CredentialHelperConfig = {
        clientId: string;
        scopes: string[];
        authorizationUrl: string;
        tokenUrl: string;
        deviceAuthorizationUrl: string | undefined;
    };
}

/**
 * The user as the provider knows them: shown in Account → Git, prefills git.name /
 * git.email.
 */
export type GitUser = { username: string; name: string; email: string | undefined };

export type GitRepository = {
    id: string;
    name: string;
    /** e.g. "my-group/my-project" */
    fullPath: string;
    description: string | undefined;
    webUrl: string;
    httpCloneUrl: string;
    defaultBranch: string | undefined;
};

export class GitProviderUnauthorizedError extends Error {
    constructor(message = "The token was rejected by the Git provider") {
        super(message);
        this.name = "GitProviderUnauthorizedError";
    }
}
