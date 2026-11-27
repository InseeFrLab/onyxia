import { createSelector } from "clean-architecture";
import type { State as RootState } from "core/bootstrap";
import type { ThemedAssetUrl } from "onyxia-ui";
import type { LocalizedString } from "core/ports/OnyxiaApi";
import type { GitForgesConfig } from "core/ports/OnyxiaApi/GitForgesConfig";
import type { GitUser } from "core/ports/GitForge";
import * as gitForgesManagement from "core/usecases/gitForgesManagement";
import { assert } from "tsafe/assert";
import {
    name,
    initialCardUiState,
    type AddForgeDialogState,
    type ManageForgeError,
    type CardError,
    type PendingAction
} from "./state";

/** What the Git tab of the account page displays. */
export type AccountView = AccountView.NotReady | AccountView.Ready;

export declare namespace AccountView {
    export type NotReady = {
        isReady: false;
        /** "unreadable config": the stored config can't be read back, it can only be reset. */
        stateDescription: "loading" | "unreadable config" | "loading failed";
    };

    export type Ready = {
        isReady: true;
        /** Markdown written by the admin in the instance configuration */
        description: LocalizedString | undefined;
        forgeCards: ForgeCard[];
    };

    export type ForgeCard = {
        id: string;
        displayName: string;
        type: GitForgesConfig.ForgeType;
        url: string;
        /** undefined: the default logo of the type */
        logoUrl: ThemedAssetUrl | undefined;
        /** Added by the user, not by the admin: it can be removed */
        isAddedByUser: boolean;
        /** "connecting": a spinner in place of the chip */
        status: "connected" | "setup required" | "connection error" | "connecting";
        /** undefined while connecting */
        message: ForgeCard.Message | undefined;
        /** Unix time in ms. undefined: no personal access token, no expiration, or not known */
        personalAccessTokenExpirationTime: number | undefined;
        /** How the last action failed */
        error: CardError | undefined;
        /** Where the user revokes Onyxia on the forge, and why it is shown */
        authorizedApplications:
            | {
                  url: string;
                  reason: "signed out without revocation" | "grant scope conflict";
              }
            | undefined;
        pendingAction: PendingAction | undefined;
        authentication:
            | {
                  type: "oauth";
                  /** undefined: signed in, the sign out button is shown instead */
                  signIn: { label: "sign in" | "sign in again" } | undefined;
                  isDisabled: boolean;
              }
            | {
                  type: "personal-access-token";
                  personalAccessTokenCreationUrl: string;
                  /** The input and the save button, once the add or replace button is clicked */
                  isFormShown: boolean;
                  /** Saved, accepted or not */
                  hasToken: boolean;
                  isDisabled: boolean;
              };
        /** Removes the forge the user added, with its token. undefined: added by the admin */
        removeForge: { isDisabled: boolean } | undefined;
    };

    export namespace ForgeCard {
        export type Message =
            | { type: "connected as"; user: GitUser }
            | { type: "not connected" }
            | {
                  type: "error";
                  reason: Extract<
                      gitForgesManagement.Connection,
                      { status: "error" }
                  >["reason"];
              };
    }
}

const cardUiStateByForgeId = (rootState: RootState) =>
    rootState[name].cardUiStateByForgeId;

const main = createSelector(
    gitForgesManagement.selectors.errorReason,
    gitForgesManagement.selectors.connections,
    gitForgesManagement.protectedSelectors.forges,
    gitForgesManagement.protectedSelectors.description,
    cardUiStateByForgeId,
    (
        errorReason,
        connections,
        forges,
        description,
        cardUiStateByForgeId
    ): AccountView => {
        if (connections === undefined) {
            return {
                isReady: false,
                stateDescription: errorReason ?? "loading"
            };
        }

        assert(forges !== undefined);

        const forgeCards = connections.map(
            ({ forgeId, connection }): AccountView.ForgeCard => {
                const entry = forges.find(({ config }) => config.id === forgeId);

                assert(entry !== undefined);

                const { userConnection, config, isAddedByUser } = entry;

                const cardUiState = cardUiStateByForgeId[forgeId] ?? initialCardUiState;

                const isDisabled =
                    cardUiState.pendingAction !== undefined ||
                    connection.status === "connecting";

                return {
                    id: forgeId,
                    displayName: config.displayName,
                    type: config.type,
                    url: config.url,
                    logoUrl: config.logoUrl,
                    isAddedByUser,
                    status: (() => {
                        switch (connection.status) {
                            case "connected":
                                return "connected";
                            case "connecting":
                                return "connecting";
                            case "error":
                                return "connection error";
                            case "not connected":
                                return "setup required";
                        }
                    })(),
                    message: (() => {
                        switch (connection.status) {
                            case "connected":
                                return { type: "connected as", user: connection.user };
                            case "not connected":
                                return { type: "not connected" };
                            case "error":
                                return { type: "error", reason: connection.reason };
                            case "connecting":
                                return undefined;
                        }
                    })(),
                    personalAccessTokenExpirationTime:
                        connection.status !== "connected"
                            ? undefined
                            : connection.personalAccessTokenExpirationTime,
                    error: cardUiState.error,
                    authorizedApplications: (() => {
                        if (userConnection.method !== "oauth") {
                            return undefined;
                        }

                        if (cardUiState.error?.type === "grant scope conflict") {
                            return {
                                url: userConnection.authorizedApplicationsUrl,
                                reason: "grant scope conflict"
                            };
                        }

                        if (cardUiState.isRevocationHintShown) {
                            return {
                                url: userConnection.authorizedApplicationsUrl,
                                reason: "signed out without revocation"
                            };
                        }

                        return undefined;
                    })(),
                    pendingAction: cardUiState.pendingAction,
                    authentication: (() => {
                        switch (userConnection.method) {
                            case "oauth":
                                return {
                                    type: "oauth",
                                    signIn:
                                        connection.status === "connected"
                                            ? undefined
                                            : {
                                                  label:
                                                      connection.status === "error"
                                                          ? "sign in again"
                                                          : "sign in"
                                              },
                                    isDisabled
                                };
                            case "personal-access-token":
                                return {
                                    type: "personal-access-token",
                                    personalAccessTokenCreationUrl:
                                        userConnection.tokenCreationUrl,
                                    isFormShown: cardUiState.isEditingPersonalAccessToken,
                                    hasToken: connection.status !== "not connected",
                                    isDisabled
                                };
                        }
                    })(),
                    removeForge: isAddedByUser ? { isDisabled } : undefined
                };
            }
        );

        return {
            isReady: true,
            description,
            forgeCards
        };
    }
);

/** The dialog where the user adds a forge of their own */
const addForgeDialog = (rootState: RootState): AddForgeDialogState =>
    rootState[name].addForgeDialog;

/** A forge the launcher offers to connect, with why it can't be used for now */
export type DisconnectedForge = {
    forgeId: string;
    displayName: string;
    type: GitForgesConfig.ForgeType;
    logoUrl: ThemedAssetUrl | undefined;
    /** Added by the user, not by the admin */
    isAddedByUser: boolean;
    /** oauth: signing in takes a click. personal-access-token: done in the manage dialog */
    connectionMethod: AccountView.ForgeCard["authentication"]["type"];
    issue:
        | "not connected"
        | Extract<gitForgesManagement.Connection, { status: "error" }>["reason"];
    isSigningIn: boolean;
    /** How the last sign in failed */
    error: CardError | undefined;
};

/**
 * In the order of the configuration, undefined until loaded. Without the connections
 * being restored when the use case loads: those are only not known yet.
 */
const disconnectedForges = createSelector(
    main,
    (view): DisconnectedForge[] | undefined => {
        if (!view.isReady) {
            return undefined;
        }

        return view.forgeCards
            .filter(
                card =>
                    card.status !== "connected" &&
                    (card.status !== "connecting" || card.pendingAction === "sign in")
            )
            .map(
                (card): DisconnectedForge => ({
                    forgeId: card.id,
                    displayName: card.displayName,
                    type: card.type,
                    logoUrl: card.logoUrl,
                    isAddedByUser: card.isAddedByUser,
                    connectionMethod: card.authentication.type,
                    issue:
                        card.message?.type === "error"
                            ? card.message.reason
                            : "not connected",
                    isSigningIn: card.pendingAction === "sign in",
                    error: card.error
                })
            );
    }
);

/** What the dialog where the user edits a forge displays */
export type ManageForgeDialogView =
    | { isOpen: false }
    | {
          isOpen: true;
          /** The forges it can switch to, in the order of the cards */
          forges: { id: string; displayName: string }[];
          card: AccountView.ForgeCard;
          /** Added by the user: its type, url and name can change. Otherwise only its token */
          isEditable: boolean;
          /** Shown masked, like the API keys of the AI forges */
          personalAccessToken: string | undefined;
          isSubmitting: boolean;
          error: ManageForgeError | undefined;
      };

/** A card has something to manage: it was added by the user, or it has a saved token */
export function getIsForgeCardManageable(card: AccountView.ForgeCard): boolean {
    return (
        card.isAddedByUser ||
        (card.authentication.type === "personal-access-token" &&
            card.authentication.hasToken)
    );
}

const manageForgeDialogState = createSelector(
    (rootState: RootState) => rootState[name],
    state => state.manageForgeDialog
);

const manageForgeDialog = createSelector(
    main,
    manageForgeDialogState,
    (rootState: RootState) =>
        gitForgesManagement.protectedSelectors.persistedGitConfig(rootState)
            .personalAccessTokenByForgeId,
    (view, dialogState, personalAccessTokenByForgeId): ManageForgeDialogView => {
        const { forgeId } = dialogState;

        if (forgeId === undefined || !view.isReady) {
            return { isOpen: false };
        }

        const card = view.forgeCards.find(({ id }) => id === forgeId);

        // NOTE: Removed meanwhile.
        if (card === undefined) {
            return { isOpen: false };
        }

        return {
            isOpen: true,
            forges: view.forgeCards
                .filter(
                    card_i => card_i.id === forgeId || getIsForgeCardManageable(card_i)
                )
                .map(({ id, displayName }) => ({ id, displayName })),
            card,
            isEditable: card.isAddedByUser,
            personalAccessToken: personalAccessTokenByForgeId[card.id],
            isSubmitting: dialogState.isSubmitting,
            error: dialogState.error
        };
    }
);

export const selectors = {
    main,
    addForgeDialog,
    manageForgeDialog,
    disconnectedForges
};

export const protectedSelectors = {
    manageForgeError: createSelector(manageForgeDialogState, state => state.error)
};

export const privateSelectors = { addForgeDialog, manageForgeDialogState };
