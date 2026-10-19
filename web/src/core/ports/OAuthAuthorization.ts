/**
 * The browser side of an OAuth 2.0 authorization code flow with PKCE, always in a popup.
 * Provider agnostic: the authorization URL is built by the caller.
 */
export type OAuthAuthorization = {
    /** <onyxia>/git/oauth/callback, to register in the OAuth applications (Onyxia's and the services') */
    redirectUri: string;

    /**
     * Must be called synchronously from the click handler (the window is
     * opened before any await). Rejects with OAuthAuthorizationError if the popup is
     * blocked, closed, denied or times out.
     */
    authorizeInPopup: (params: {
        getAuthorizationUrl: (params: { state: string; codeChallenge: string }) => string;
    }) => Promise<{ code: string; codeVerifier: string }>;
};

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

/** Relative to the app root. Handled in main.tsx, before oidc-spa */
export const GIT_OAUTH_CALLBACK_PATH = "git/oauth/callback";
