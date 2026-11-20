import type { GitProvidersConfig } from "core/ports/OnyxiaApi/GitProvidersConfig";

/**
 * A Git hosting service (GitLab, Forgejo, GitHub, Bitbucket), one instance per configured
 * provider. What the use cases do with it: connect the user, act on their behalf, give
 * the services their credentials at launch. The rest (id, url, displayName, lifetimes) is
 * in the configuration.
 *
 * The API is stateless: tokens are passed in, an OAuth access token or a personal access
 * token, the API is the same. Only the OAuth session (refresh token) is kept, see
 * GitProvider.OAuth.
 */
export type GitProvider = {
    /** Account → Git: how the user connects Onyxia to the provider */
    userConnection:
        | ({ method: "oauth" } & GitProvider.OAuth)
        | {
              method: "personal-access-token";
              /** Scopes prefilled when the provider allows it */
              tokenCreationUrl: string;
              /**
               * Unix time in ms. Resolves undefined when the token has no expiration.
               * undefined: the provider doesn't tell it to the browser (GitHub doesn't
               * expose its header through CORS, Forgejo and Bitbucket have no such API).
               */
              getTokenExpirationTime:
                  | ((params: { accessToken: string }) => Promise<number | undefined>)
                  | undefined;
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
              /** The service is authorized when the user clicks "Launch" (popup) */
              authorizeAtLaunch: GitProvider.ServiceAuthorization;
          };
};

export namespace GitProvider {
    /**
     * Onyxia's OAuth application. The session (refresh token) is kept by the provider
     * between two visits, per Onyxia user, the access tokens are the use case's.
     */
    export type OAuth = {
        /**
         * Must be called synchronously from the click handler, the popup is opened
         * before any await. Rejects with OAuthAuthorizationError if the popup is
         * blocked, closed, denied or times out. Keeps the session when the provider
         * issues a refresh token.
         */
        signIn: () => Promise<Tokens>;
        /** A session is kept, from a previous visit or another tab */
        hasSession: () => boolean;
        /**
         * Exclusive across the tabs (a refresh token is single use). Rejects with
         * GitProviderUnauthorizedError when there is no session anymore or the provider
         * rejects it, the session is then dropped.
         */
        refreshTokens: () => Promise<Tokens>;
        /**
         * Drops the session right away, then revokes the grant when the provider
         * supports it. isGrantRevoked false: the user has to revoke it on the provider
         * (authorizedApplicationsUrl).
         */
        signOut: () => Promise<{ isGrantRevoked: boolean }>;
        authorizedApplicationsUrl: string;
    };

    export type Tokens = {
        accessToken: string;
        /** Unix time in ms */
        expirationTime: number;
    };

    /** Onyxia only authorizes, the service refreshes */
    export type ServiceAuthorization = {
        /**
         * Must be called synchronously from the click handler, like OAuth.signIn.
         * Rejects with OAuthAuthorizationError when the authorization didn't go
         * through, with another error when the code exchange failed.
         */
        authorize: () => Promise<ServiceTokens>;
    };

    /**
     * Issued for the services' OAuth application, the one git-credential-oauth refreshes
     * with: the refresh token goes to git.providers[].credentials.refreshToken.
     */
    export type ServiceTokens = {
        accessToken: string;
        refreshToken: string;
        /** Unix time in ms */
        expirationTime: number;
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

/**
 * The adapter of a provider, of GIT_PROVIDERS or added by the user. See
 * gitProvidersManagement's gitProviders selector for the list.
 */
export type CreateGitProvider = (params: {
    config: GitProvidersConfig.Provider;
}) => GitProvider;

export class OAuthAuthorizationError extends Error {
    constructor(
        public readonly reason: "popup blocked" | "popup closed" | "denied" | "timeout",
        message: string,
        /** "denied" only: what the provider said, its error_description or error code */
        public readonly providerError?: string
    ) {
        super(message);
        this.name = "OAuthAuthorizationError";
    }
}

export class GitProviderUnauthorizedError extends Error {
    constructor(message = "The token was rejected by the Git provider") {
        super(message);
        this.name = "GitProviderUnauthorizedError";
    }
}
