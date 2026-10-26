/**
 * A Git hosting service (GitLab, Forgejo, GitHub), one instance per configured provider.
 *
 * Stateless: tokens are passed in, an OAuth access token or a personal access token,
 * the API is the same. The provider type stays in the configuration, it selects the
 * adapter and never leaves it.
 */
export type GitProvider = {
    id: string;
    displayName: string;
    /** A repository belongs to this provider if its URL starts with `${url}/` */
    url: string;

    /** How Onyxia accesses the provider */
    ui:
        | { type: "oauth"; oauth: GitProvider.OAuth }
        | {
              type: "personal-access-token";
              /** Derived by the adapter from url, scopes prefilled when the provider allows it */
              personalAccessTokenCreationUrl: string;
          };

    /** What the services get to clone and push */
    service:
        | {
              type: "personal-access-token";
              /** Paired with the PAT for git over HTTPS. undefined: the user's username */
              gitUsername?: string;
          }
        | {
              type: "scoped-access-token";
              /** Of the tokens created at launch, service.lifetimeDays of the configuration */
              lifetimeDays: number;
              /** accessToken: the user's OAuth access token or PAT (scope api) */
              createAccessToken: (params: {
                  accessToken: string;
                  name: string;
                  repositories: "all" | { urls: string[] };
                  permission: "read" | "read-write";
                  /** Unix time in ms */
                  expirationTime: number;
              }) => Promise<GitAccessToken>;
          }
        | {
              type: "oauth";
              helperConfig: GitProvider.CredentialHelperConfig;
              /** Onyxia gets the first tokens at launch. undefined: device flow in the service (GitHub) */
              authorization: GitProvider.ServiceAuthorization | undefined;
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
        refreshTokens: (params: { refreshToken: string }) => Promise<Tokens>;
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
 * git.email, git username paired with a PAT.
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

export type GitAccessToken = {
    id: string;
    token: string;
    /** To pair with the token for git over HTTPS */
    gitUsername: string;
    /** Unix time in ms */
    expirationTime: number;
};

export class GitProviderUnauthorizedError extends Error {
    constructor(message = "The token was rejected by the Git provider") {
        super(message);
        this.name = "GitProviderUnauthorizedError";
    }
}
