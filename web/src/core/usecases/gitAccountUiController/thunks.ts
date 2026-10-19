import type { Thunks } from "core/bootstrap";
import * as gitProvidersManagement from "core/usecases/gitProvidersManagement";

export const thunks = {
    /** Whether the Git providers are shown in the account tab. */
    isAvailable:
        () =>
        (...args): boolean => {
            const [dispatch] = args;

            return dispatch(gitProvidersManagement.thunks.isAvailable());
        },
    /**
     * The former "GitHub personal access token" field is hidden as soon as GIT_PROVIDERS
     * isn't empty: the admin who wants GitHub adds it to the configuration.
     */
    isLegacyGitHubPersonalAccessTokenFieldVisible:
        () =>
        (...args): boolean => {
            const [, , { gitProvidersConfig }] = args;

            return gitProvidersConfig.providers.length === 0;
        },
    load:
        () =>
        async (...args): Promise<void> => {
            const [dispatch] = args;

            await dispatch(gitProvidersManagement.thunks.load());
        },
    /** Only when the stored config can't be read back: everything it held is lost. */
    resetConfig:
        () =>
        async (...args): Promise<void> => {
            const [dispatch] = args;

            await dispatch(gitProvidersManagement.thunks.resetConfig());
        },
    /**
     * Must be dispatched synchronously from the click handler (popup). Rejects with
     * OAuthAuthorizationError, e.g. reason "popup blocked": tell the user to allow
     * popups for this site.
     */
    signIn:
        (params: { providerId: string }) =>
        (...args): Promise<void> => {
            const [dispatch] = args;

            return dispatch(gitProvidersManagement.thunks.signIn(params));
        },
    signOut:
        (params: { providerId: string }) =>
        async (...args): Promise<void> => {
            const [dispatch] = args;

            await dispatch(gitProvidersManagement.thunks.signOut(params));
        },
    /** isAccepted false: the provider rejected the token, nothing was saved. */
    setPersonalAccessToken:
        (params: { providerId: string; personalAccessToken: string }) =>
        async (...args): Promise<{ isAccepted: boolean }> => {
            const [dispatch] = args;

            return dispatch(gitProvidersManagement.thunks.setPersonalAccessToken(params));
        },
    removePersonalAccessToken:
        (params: { providerId: string }) =>
        async (...args): Promise<void> => {
            const [dispatch] = args;

            await dispatch(
                gitProvidersManagement.thunks.removePersonalAccessToken(params)
            );
        },
    setFavoriteProvider:
        (params: { providerId: string }) =>
        async (...args): Promise<void> => {
            const [dispatch] = args;

            await dispatch(gitProvidersManagement.thunks.setFavoriteProvider(params));
        }
} satisfies Thunks;
