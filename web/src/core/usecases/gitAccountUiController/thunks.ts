import type { Thunks } from "core/bootstrap";
import * as gitProvidersManagement from "core/usecases/gitProvidersManagement";
import { actions, type CardError, type PendingAction } from "./state";
import { getSignInCardError } from "./decoupledLogic";

/**
 * The card actions never reject: how they went is in the state, the view tells the
 * card what to display.
 */
export const thunks = {
    /** Whether the Git providers are shown in the account tab. */
    isAvailable:
        () =>
        (...args): boolean => {
            const [dispatch] = args;

            return dispatch(gitProvidersManagement.thunks.isAvailable());
        },
    /**
     * The former fields (git name, git email, GitHub personal access token) are hidden
     * as soon as GIT_PROVIDERS isn't empty: the identity comes from the favorite
     * provider, and the admin who wants GitHub adds it to the configuration.
     */
    isLegacySectionVisible:
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
     * Must be dispatched synchronously from the click handler: the popup is opened
     * before anything is awaited, otherwise the browser blocks it.
     */
    signIn:
        (params: { providerId: string }) =>
        (...args): Promise<void> => {
            const { providerId } = params;

            const [dispatch] = args;

            dispatch(actions.actionStarted({ providerId, pendingAction: "sign in" }));

            // NOTE: Not an async function, nothing is awaited before the popup opens.
            return dispatch(gitProvidersManagement.thunks.signIn({ providerId })).then(
                () => {
                    dispatch(
                        actions.actionSucceeded({
                            providerId,
                            isRevocationHintShown: false
                        })
                    );
                },
                error => {
                    dispatch(
                        actions.actionFailed({
                            providerId,
                            error: getSignInCardError({ error })
                        })
                    );
                }
            );
        },
    signOut:
        (params: { providerId: string }) =>
        async (...args): Promise<void> => {
            const { providerId } = params;

            const [dispatch, , { gitProviders }] = args;

            await dispatch(
                privateThunks.runCardAction({
                    providerId,
                    pendingAction: "sign out",
                    action: () =>
                        dispatch(gitProvidersManagement.thunks.signOut({ providerId })),
                    getCardError: () => ({ type: "sign out failed" }),
                    // NOTE: Without revocation, the grant still exists on the provider.
                    getIsRevocationHintShown: () => {
                        const gitProvider = gitProviders.find(
                            ({ id }) => id === providerId
                        );

                        return (
                            gitProvider?.ui.type === "oauth" &&
                            gitProvider.ui.oauth.revokeTokens === undefined
                        );
                    }
                })
            );
        },
    setPersonalAccessToken:
        (params: { providerId: string; personalAccessToken: string }) =>
        async (...args): Promise<void> => {
            const { providerId, personalAccessToken } = params;

            const [dispatch] = args;

            if (personalAccessToken.trim() === "") {
                return;
            }

            await dispatch(
                privateThunks.runCardAction({
                    providerId,
                    pendingAction: "set personal access token",
                    action: async () => {
                        const { isAccepted } = await dispatch(
                            gitProvidersManagement.thunks.setPersonalAccessToken({
                                providerId,
                                personalAccessToken
                            })
                        );

                        if (!isAccepted) {
                            throw new PersonalAccessTokenRejectedError();
                        }
                    },
                    getCardError: error =>
                        error instanceof PersonalAccessTokenRejectedError
                            ? { type: "personal access token rejected" }
                            : { type: "personal access token check failed" }
                })
            );
        },
    startReplacingPersonalAccessToken:
        (params: { providerId: string }) =>
        (...args): void => {
            const [dispatch] = args;

            dispatch(
                actions.replacingPersonalAccessTokenToggled({
                    providerId: params.providerId,
                    isReplacingPersonalAccessToken: true
                })
            );
        },
    cancelReplacingPersonalAccessToken:
        (params: { providerId: string }) =>
        (...args): void => {
            const [dispatch] = args;

            dispatch(
                actions.replacingPersonalAccessTokenToggled({
                    providerId: params.providerId,
                    isReplacingPersonalAccessToken: false
                })
            );
        },
    removePersonalAccessToken:
        (params: { providerId: string }) =>
        async (...args): Promise<void> => {
            const { providerId } = params;

            const [dispatch] = args;

            await dispatch(
                privateThunks.runCardAction({
                    providerId,
                    pendingAction: "remove personal access token",
                    action: () =>
                        dispatch(
                            gitProvidersManagement.thunks.removePersonalAccessToken({
                                providerId
                            })
                        ),
                    getCardError: () => ({ type: "remove failed" })
                })
            );
        },
    setFavoriteProvider:
        (params: { providerId: string }) =>
        async (...args): Promise<void> => {
            const [dispatch] = args;

            await dispatch(gitProvidersManagement.thunks.setFavoriteProvider(params));
        }
} satisfies Thunks;

const privateThunks = {
    runCardAction:
        (params: {
            providerId: string;
            pendingAction: PendingAction;
            action: () => Promise<void>;
            getCardError: (error: unknown) => CardError;
            getIsRevocationHintShown?: () => boolean;
        }) =>
        async (...args): Promise<void> => {
            const {
                providerId,
                pendingAction,
                action,
                getCardError,
                getIsRevocationHintShown = () => false
            } = params;

            const [dispatch] = args;

            dispatch(actions.actionStarted({ providerId, pendingAction }));

            try {
                await action();
            } catch (error) {
                dispatch(
                    actions.actionFailed({ providerId, error: getCardError(error) })
                );
                return;
            }

            dispatch(
                actions.actionSucceeded({
                    providerId,
                    isRevocationHintShown: getIsRevocationHintShown()
                })
            );
        }
} satisfies Thunks;

class PersonalAccessTokenRejectedError extends Error {}
