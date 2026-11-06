import { createSelector } from "clean-architecture";
import type { State as RootState } from "core/bootstrap";
import type { LocalizedString } from "core/ports/OnyxiaApi";
import type { GitProvidersConfig } from "core/ports/OnyxiaApi/GitProvidersConfig";
import type { GitUser } from "core/ports/GitProvider";
import * as gitProvidersManagement from "core/usecases/gitProvidersManagement";
import { getRootContext } from "core/rootContext";
import { assert } from "tsafe/assert";
import {
    name,
    initialCardUiState,
    type AddProviderDialogState,
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
        providerCards: ProviderCard[];
    };

    export type ProviderCard = {
        id: string;
        displayName: string;
        type: GitProvidersConfig.ProviderType;
        url: string;
        /** undefined: the default logo of the type */
        logoUrl: GitProvidersConfig.LogoUrl | undefined;
        documentation: GitProvidersConfig.Documentation | undefined;
        /** Added by the user, not by the admin: it can be removed */
        isAddedByUser: boolean;
        /** "connecting": a spinner in place of the chip */
        status: "connected" | "setup required" | "connection error" | "connecting";
        /** undefined while connecting */
        message: ProviderCard.Message | undefined;
        /** undefined unless connected */
        gitIdentity:
            | {
                  name: string;
                  /** undefined: private on the provider, the Onyxia account's is used */
                  email: string | undefined;
                  /** It is the favorite provider: this identity is used at launch */
                  isUsedAtLaunch: boolean;
              }
            | undefined;
        favorite: "is favorite" | "can be set as favorite";
        /** How the last action failed */
        error: CardError | undefined;
        /** Where the user revokes Onyxia on the provider, and why it is shown */
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
                  /** The input and the save button */
                  isFormShown: boolean;
                  isReplaceButtonShown: boolean;
                  isCancelButtonShown: boolean;
                  /** Removes the token. Never for a provider added by the user, removed as a whole */
                  isRemoveButtonShown: boolean;
                  isDisabled: boolean;
              };
        /** Removes the provider the user added, with its token. undefined: added by the admin */
        removeProvider: { isDisabled: boolean } | undefined;
    };

    export namespace ProviderCard {
        export type Message =
            | { type: "connected as"; user: GitUser }
            | { type: "not connected" }
            | {
                  type: "error";
                  reason: Extract<
                      gitProvidersManagement.Connection,
                      { status: "error" }
                  >["reason"];
              };
    }
}

const cardUiStateByProviderId = (rootState: RootState) =>
    rootState[name].cardUiStateByProviderId;

const main = createSelector(
    gitProvidersManagement.selectors.errorReason,
    gitProvidersManagement.selectors.connections,
    gitProvidersManagement.selectors.favoriteProviderId,
    gitProvidersManagement.protectedSelectors.gitProviders,
    cardUiStateByProviderId,
    (
        errorReason,
        connections,
        favoriteProviderId,
        gitProviders,
        cardUiStateByProviderId
    ): AccountView => {
        if (connections === undefined) {
            return {
                isReady: false,
                stateDescription: errorReason ?? "loading"
            };
        }

        const { gitProvidersConfig } = getRootContext();

        const providerCards = connections.map(
            ({ providerId, connection }): AccountView.ProviderCard => {
                const entry = gitProviders.find(({ config }) => config.id === providerId);

                assert(entry !== undefined);

                const { gitProvider, config, isAddedByUser } = entry;

                const cardUiState =
                    cardUiStateByProviderId[providerId] ?? initialCardUiState;

                const isFavorite = providerId === favoriteProviderId;

                const isDisabled =
                    cardUiState.pendingAction !== undefined ||
                    connection.status === "connecting";

                return {
                    id: providerId,
                    displayName: config.displayName,
                    type: config.type,
                    url: config.url,
                    logoUrl: config.logoUrl,
                    documentation: config.documentation,
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
                    gitIdentity:
                        connection.status !== "connected"
                            ? undefined
                            : {
                                  name: connection.user.name,
                                  email: connection.user.email,
                                  isUsedAtLaunch: isFavorite
                              },
                    favorite: isFavorite ? "is favorite" : "can be set as favorite",
                    error: cardUiState.error,
                    authorizedApplications: (() => {
                        const { userConnection } = gitProvider;

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
                        switch (gitProvider.userConnection.method) {
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
                            case "personal-access-token": {
                                const isConnected = connection.status === "connected";
                                const { isReplacingPersonalAccessToken } = cardUiState;

                                return {
                                    type: "personal-access-token",
                                    personalAccessTokenCreationUrl:
                                        gitProvider.userConnection.tokenCreationUrl,
                                    isFormShown:
                                        !isConnected || isReplacingPersonalAccessToken,
                                    isReplaceButtonShown:
                                        isConnected && !isReplacingPersonalAccessToken,
                                    isCancelButtonShown: isReplacingPersonalAccessToken,
                                    // A saved token, accepted or not
                                    isRemoveButtonShown:
                                        !isAddedByUser &&
                                        connection.status !== "not connected" &&
                                        !isReplacingPersonalAccessToken,
                                    isDisabled
                                };
                            }
                        }
                    })(),
                    removeProvider: isAddedByUser ? { isDisabled } : undefined
                };
            }
        );

        return {
            isReady: true,
            description: gitProvidersConfig.description,
            providerCards
        };
    }
);

/** The dialog where the user adds a provider of their own */
const addProviderDialog = (rootState: RootState): AddProviderDialogState =>
    rootState[name].addProviderDialog;

export const selectors = { main, addProviderDialog };
