import type { Thunks } from "core/bootstrap";
import type { GitProvidersConfig } from "core/ports/OnyxiaApi/GitProvidersConfig";
import * as gitProvidersManagement from "core/usecases/gitProvidersManagement";
import {
    getUserProviderConfig,
    normalizeUserProviderUrl
} from "core/usecases/gitProvidersManagement/decoupledLogic/userProviders";
import { assert } from "tsafe/assert";
import {
    actions,
    name,
    type AddProviderError,
    type CardError,
    type PendingAction
} from "./state";
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
     * The former fields (git name, git email, GitHub personal access token) are only
     * shown when the integration is disabled: otherwise the identity comes from the
     * favorite provider, and GitHub is a provider like the others (the former token
     * is migrated to it).
     */
    isLegacySectionVisible:
        () =>
        (...args): boolean => {
            const [, , { gitProvidersConfig }] = args;

            return (
                gitProvidersConfig.providers.length === 0 &&
                gitProvidersConfig.disallowUserToAddProviders
            );
        },
    canUserAddProviders:
        () =>
        (...args): boolean => {
            const [dispatch] = args;

            return dispatch(gitProvidersManagement.thunks.canUserAddProviders());
        },
    openAddProviderDialog:
        () =>
        (...args): void => {
            const [dispatch] = args;

            dispatch(actions.addProviderDialogOpened());
        },
    closeAddProviderDialog:
        () =>
        (...args): void => {
            const [dispatch, getState] = args;

            if (getState()[name].addProviderDialog.isSubmitting) {
                return;
            }

            dispatch(actions.addProviderDialogClosed());
        },
    /** The dialog closes once the provider is added, otherwise it shows why it wasn't. */
    addProvider:
        (params: {
            type: GitProvidersConfig.ProviderType;
            url: string;
            displayName: string;
            personalAccessToken: string;
        }) =>
        async (...args): Promise<void> => {
            const [dispatch] = args;

            dispatch(actions.addProviderStarted());

            let error: AddProviderError | undefined;

            try {
                const result = await dispatch(
                    gitProvidersManagement.thunks.addUserProvider(params)
                );

                error = result.isSuccess ? undefined : result.error;
            } catch {
                // NOTE: The provider accepted the token, saving the config failed.
                error = "save failed";
            }

            if (error !== undefined) {
                dispatch(actions.addProviderFailed({ error }));
                return;
            }

            dispatch(actions.addProviderDialogClosed());
        },
    /**
     * Where the user creates the token for the url being typed, with the scopes prefilled
     * when the provider allows it. undefined while the url isn't valid.
     */
    getPersonalAccessTokenCreationUrl:
        (params: { type: GitProvidersConfig.ProviderType; url: string }) =>
        (...args): string | undefined => {
            const { type } = params;

            const [, , { createGitProvider }] = args;

            const url = normalizeUserProviderUrl(params.url);

            if (url === undefined) {
                return undefined;
            }

            const { userConnection } = createGitProvider({
                config: getUserProviderConfig({
                    userProvider: { id: url, type, url, displayName: url }
                })
            });

            assert(userConnection.method === "personal-access-token");

            return userConnection.tokenCreationUrl;
        },
    removeProvider:
        (params: { providerId: string }) =>
        async (...args): Promise<void> => {
            const { providerId } = params;

            const [dispatch] = args;

            await dispatch(
                privateThunks.runCardAction({
                    providerId,
                    pendingAction: "remove provider",
                    action: () =>
                        dispatch(
                            gitProvidersManagement.thunks.removeUserProvider({
                                providerId
                            })
                        ),
                    getCardError: () => ({ type: "remove provider failed" })
                })
            );
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

            const [dispatch] = args;

            let isGrantRevoked = false;

            await dispatch(
                privateThunks.runCardAction({
                    providerId,
                    pendingAction: "sign out",
                    action: async () => {
                        ({ isGrantRevoked } = await dispatch(
                            gitProvidersManagement.thunks.signOut({ providerId })
                        ));
                    },
                    getCardError: () => ({ type: "sign out failed" }),
                    // NOTE: Not revoked (unsupported or failed), the grant still exists
                    // on the provider.
                    getIsRevocationHintShown: () => !isGrantRevoked
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
