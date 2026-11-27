import type { GitForgesConfig } from "core/ports/OnyxiaApi/GitForgesConfig";

/**
 * A Git hosting service (GitLab, Forgejo, GitHub, Bitbucket), one instance per configured
 * forge. What the use cases do with it: connect the user, act on their behalf, give
 * the services their credentials at launch. The rest (id, url, displayName, lifetimes) is
 * in the configuration.
 *
 * The API is stateless: tokens are passed in, an OAuth access token or a personal access
 * token, the API is the same. Only the OAuth session (refresh token) is kept, see
 * GitForge.OAuth.
 */
export type GitForge = {
    /** Account → Git: how the user connects Onyxia to the forge */
    userConnection:
        | ({ method: "oauth" } & GitForge.OAuth)
        | {
              method: "personal-access-token";
              /** Scopes prefilled when the forge allows it */
              tokenCreationUrl: string;
              /**
               * Unix time in ms. Resolves undefined when the token has no expiration.
               * undefined: the forge doesn't tell it to the browser (GitHub doesn't
               * expose its header through CORS, Forgejo and Bitbucket have no such API).
               */
              getTokenExpirationTime:
                  | ((params: { accessToken: string }) => Promise<number | undefined>)
                  | undefined;
          };

    // API on behalf of the user (OAuth access token or PAT).
    // Throw GitForgeUnauthorizedError when the token is rejected.
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
              helperConfig: GitForge.CredentialHelperConfig;
              /** The service is authorized when the user clicks "Launch" (popup) */
              authorizeAtLaunch: GitForge.ServiceAuthorization;
          };
};

export namespace GitForge {
    /**
     * Onyxia's OAuth application. The session (refresh token) is kept by the forge
     * between two visits, per Onyxia user, the access tokens are the use case's.
     */
    export type OAuth = {
        /**
         * Must be called synchronously from the click handler, the popup is opened
         * before any await. Rejects with OAuthAuthorizationError if the popup is
         * blocked, closed, denied or times out. Keeps the session when the forge
         * issues a refresh token.
         */
        signIn: () => Promise<Tokens>;
        /** A session is kept, from a previous visit or another tab */
        hasSession: () => boolean;
        /**
         * Exclusive across the tabs (a refresh token is single use). Rejects with
         * GitForgeUnauthorizedError when there is no session anymore or the forge
         * rejects it, the session is then dropped.
         */
        refreshTokens: () => Promise<Tokens>;
        /**
         * Drops the session right away, then revokes the grant when the forge
         * supports it. isGrantRevoked false: the user has to revoke it on the forge
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
     * with: the refresh token goes to git.forges[].credentials.refreshToken.
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
 * The user as the forge knows them: shown in Account → Git, prefills git.name /
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
 * The adapter of a forge, of GIT_FORGES or added by the user. See
 * gitForgesManagement's gitForges selector for the list.
 */
export type CreateGitForge = (params: { config: GitForgesConfig.Forge }) => GitForge;

export class OAuthAuthorizationError extends Error {
    constructor(
        public readonly reason: "popup blocked" | "popup closed" | "denied" | "timeout",
        message: string,
        /** "denied" only: what the forge said, its error_description or error code */
        public readonly forgeError?: string
    ) {
        super(message);
        this.name = "OAuthAuthorizationError";
    }
}

export class GitForgeUnauthorizedError extends Error {
    constructor(message = "The token was rejected by the Git forge") {
        super(message);
        this.name = "GitForgeUnauthorizedError";
    }
}
