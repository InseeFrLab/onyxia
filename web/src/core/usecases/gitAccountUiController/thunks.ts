import type { Thunks } from "core/bootstrap";
import type { GitForgesConfig } from "core/ports/OnyxiaApi/GitForgesConfig";
import * as gitForgesManagement from "core/usecases/gitForgesManagement";
import {
    getUserForgeConfig,
    normalizeUserForgeUrl
} from "core/usecases/gitForgesManagement/decoupledLogic/userForges";
import { assert } from "tsafe/assert";
import {
    actions,
    type AddForgeError,
    type ManageForgeError,
    type CardError,
    type PendingAction
} from "./state";
import { getSignInCardError } from "./decoupledLogic";
import { privateSelectors } from "./selectors";

/**
 * The card actions never reject: how they went is in the state, the view tells the
 * card what to display.
 */
export const thunks = {
    /** Whether the Git forges are shown in the account tab. */
    isAvailable:
        () =>
        (...args): boolean => {
            const [dispatch] = args;

            return dispatch(gitForgesManagement.thunks.isAvailable());
        },
    canUserAddForges:
        () =>
        (...args): boolean => {
            const [dispatch] = args;

            return dispatch(gitForgesManagement.thunks.canUserAddForges());
        },
    openAddForgeDialog:
        () =>
        (...args): void => {
            const [dispatch] = args;

            dispatch(actions.addForgeDialogOpened());
        },
    closeAddForgeDialog:
        () =>
        (...args): void => {
            const [dispatch, getState] = args;

            if (privateSelectors.addForgeDialog(getState()).isSubmitting) {
                return;
            }

            dispatch(actions.addForgeDialogClosed());
        },
    /** The dialog closes once the forge is added, otherwise it shows why it wasn't. */
    addForge:
        (params: {
            type: GitForgesConfig.ForgeType;
            url: string;
            displayName: string;
            personalAccessToken: string;
        }) =>
        async (...args): Promise<void> => {
            const [dispatch] = args;

            dispatch(actions.addForgeStarted());

            let error: AddForgeError | undefined;

            try {
                const result = await dispatch(
                    gitForgesManagement.thunks.addUserForge(params)
                );

                error = result.isSuccess ? undefined : result.error;
            } catch {
                // NOTE: The forge accepted the token, saving the config failed.
                error = "save failed";
            }

            if (error !== undefined) {
                dispatch(actions.addForgeFailed({ error }));
                return;
            }

            dispatch(actions.addForgeDialogClosed());
        },
    /**
     * Where the user creates the token for the url being typed, with the scopes prefilled
     * when the forge allows it. undefined while the url isn't valid.
     */
    getPersonalAccessTokenCreationUrl:
        (params: { type: GitForgesConfig.ForgeType; url: string }) =>
        (...args): string | undefined => {
            const { type } = params;

            const [, , { createGitForge }] = args;

            const url = normalizeUserForgeUrl(params.url);

            if (url === undefined) {
                return undefined;
            }

            const { userConnection } = createGitForge({
                config: getUserForgeConfig({
                    userForge: { id: url, type, url, displayName: url }
                })
            });

            assert(userConnection.method === "personal-access-token");

            return userConnection.tokenCreationUrl;
        },
    /** Also to switch from one forge to another, what was typed is discarded */
    openManageForgeDialog:
        (params: { forgeId: string }) =>
        (...args): void => {
            const [dispatch, getState] = args;

            if (privateSelectors.manageForgeDialogState(getState()).isSubmitting) {
                return;
            }

            dispatch(actions.manageForgeDialogOpened({ forgeId: params.forgeId }));
        },
    closeManageForgeDialog:
        () =>
        (...args): void => {
            const [dispatch, getState] = args;

            if (privateSelectors.manageForgeDialogState(getState()).isSubmitting) {
                return;
            }

            dispatch(actions.manageForgeDialogClosed());
        },
    /**
     * The dialog closes once saved, otherwise it shows why it wasn't. A forge of the
     * admin: only its token can change. personalAccessToken empty: the saved one is kept.
     */
    saveManagedForge:
        (params: {
            type: GitForgesConfig.ForgeType;
            url: string;
            displayName: string;
            personalAccessToken: string;
        }) =>
        async (...args): Promise<void> => {
            const [dispatch, getState] = args;

            const { forgeId } = privateSelectors.manageForgeDialogState(getState());

            assert(forgeId !== undefined);

            const isAddedByUser = (
                gitForgesManagement.protectedSelectors.forges(getState()) ?? []
            ).some(({ config, isAddedByUser }) => isAddedByUser && config.id === forgeId);

            dispatch(actions.manageForgeStarted());

            let error: ManageForgeError | undefined;

            try {
                if (isAddedByUser) {
                    const result = await dispatch(
                        gitForgesManagement.thunks.updateUserForge({
                            forgeId,
                            type: params.type,
                            url: params.url,
                            displayName: params.displayName,
                            personalAccessToken: params.personalAccessToken
                        })
                    );

                    error = result.isSuccess ? undefined : result.error;
                } else if (params.personalAccessToken.trim() !== "") {
                    const { isAccepted } = await dispatch(
                        gitForgesManagement.thunks.setPersonalAccessToken({
                            forgeId,
                            personalAccessToken: params.personalAccessToken
                        })
                    );

                    error = isAccepted ? undefined : "personal access token rejected";
                }
            } catch {
                // NOTE: The forge accepted the token, saving the config failed.
                error = "save failed";
            }

            if (error !== undefined) {
                dispatch(actions.manageForgeFailed({ error }));
                return;
            }

            dispatch(actions.manageForgeDialogClosed());
        },
    removeForge:
        (params: { forgeId: string }) =>
        async (...args): Promise<void> => {
            const { forgeId } = params;

            const [dispatch] = args;

            await dispatch(
                privateThunks.runCardAction({
                    forgeId,
                    pendingAction: "remove forge",
                    action: () =>
                        dispatch(
                            gitForgesManagement.thunks.removeUserForge({
                                forgeId
                            })
                        ),
                    getCardError: () => ({ type: "remove forge failed" })
                })
            );
        },
    load:
        () =>
        async (...args): Promise<void> => {
            const [dispatch] = args;

            await dispatch(gitForgesManagement.thunks.load());
        },
    /** Only when the stored config can't be read back: everything it held is lost. */
    resetConfig:
        () =>
        async (...args): Promise<void> => {
            const [dispatch] = args;

            await dispatch(gitForgesManagement.thunks.resetConfig());
        },
    /**
     * Must be dispatched synchronously from the click handler: the popup is opened
     * before anything is awaited, otherwise the browser blocks it.
     */
    signIn:
        (params: { forgeId: string }) =>
        (...args): Promise<void> => {
            const { forgeId } = params;

            const [dispatch] = args;

            dispatch(actions.actionStarted({ forgeId, pendingAction: "sign in" }));

            // NOTE: Not an async function, nothing is awaited before the popup opens.
            return dispatch(gitForgesManagement.thunks.signIn({ forgeId })).then(
                () => {
                    dispatch(
                        actions.actionSucceeded({
                            forgeId,
                            isRevocationHintShown: false
                        })
                    );
                },
                error => {
                    dispatch(
                        actions.actionFailed({
                            forgeId,
                            error: getSignInCardError({ error })
                        })
                    );
                }
            );
        },
    signOut:
        (params: { forgeId: string }) =>
        async (...args): Promise<void> => {
            const { forgeId } = params;

            const [dispatch] = args;

            let isGrantRevoked = false;

            await dispatch(
                privateThunks.runCardAction({
                    forgeId,
                    pendingAction: "sign out",
                    action: async () => {
                        ({ isGrantRevoked } = await dispatch(
                            gitForgesManagement.thunks.signOut({ forgeId })
                        ));
                    },
                    getCardError: () => ({ type: "sign out failed" }),
                    // NOTE: Not revoked (unsupported or failed), the grant still exists
                    // on the forge.
                    getIsRevocationHintShown: () => !isGrantRevoked
                })
            );
        },
    setPersonalAccessToken:
        (params: { forgeId: string; personalAccessToken: string }) =>
        async (...args): Promise<void> => {
            const { forgeId, personalAccessToken } = params;

            const [dispatch] = args;

            if (personalAccessToken.trim() === "") {
                return;
            }

            await dispatch(
                privateThunks.runCardAction({
                    forgeId,
                    pendingAction: "set personal access token",
                    action: async () => {
                        const { isAccepted } = await dispatch(
                            gitForgesManagement.thunks.setPersonalAccessToken({
                                forgeId,
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
    startEditingPersonalAccessToken:
        (params: { forgeId: string }) =>
        (...args): void => {
            const [dispatch] = args;

            dispatch(
                actions.editingPersonalAccessTokenToggled({
                    forgeId: params.forgeId,
                    isEditingPersonalAccessToken: true
                })
            );
        },
    cancelEditingPersonalAccessToken:
        (params: { forgeId: string }) =>
        (...args): void => {
            const [dispatch] = args;

            dispatch(
                actions.editingPersonalAccessTokenToggled({
                    forgeId: params.forgeId,
                    isEditingPersonalAccessToken: false
                })
            );
        },
    removePersonalAccessToken:
        (params: { forgeId: string }) =>
        async (...args): Promise<void> => {
            const { forgeId } = params;

            const [dispatch] = args;

            await dispatch(
                privateThunks.runCardAction({
                    forgeId,
                    pendingAction: "remove personal access token",
                    action: () =>
                        dispatch(
                            gitForgesManagement.thunks.removePersonalAccessToken({
                                forgeId
                            })
                        ),
                    getCardError: () => ({ type: "remove failed" })
                })
            );
        }
} satisfies Thunks;

const privateThunks = {
    runCardAction:
        (params: {
            forgeId: string;
            pendingAction: PendingAction;
            action: () => Promise<void>;
            getCardError: (error: unknown) => CardError;
            getIsRevocationHintShown?: () => boolean;
        }) =>
        async (...args): Promise<void> => {
            const {
                forgeId,
                pendingAction,
                action,
                getCardError,
                getIsRevocationHintShown = () => false
            } = params;

            const [dispatch] = args;

            dispatch(actions.actionStarted({ forgeId, pendingAction }));

            try {
                await action();
            } catch (error) {
                dispatch(actions.actionFailed({ forgeId, error: getCardError(error) }));
                return;
            }

            dispatch(
                actions.actionSucceeded({
                    forgeId,
                    isRevocationHintShown: getIsRevocationHintShown()
                })
            );
        }
} satisfies Thunks;

class PersonalAccessTokenRejectedError extends Error {}
