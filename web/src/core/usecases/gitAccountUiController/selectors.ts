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
              }
            | undefined;
        /** Unix time in ms. undefined: no personal access token, no expiration, or not known */
        personalAccessTokenExpirationTime: number | undefined;
        /** The tokens created for each service at launch. undefined unless connected and scoped */
        serviceTokenLifetimeDays: number | undefined;
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
                  /** The input and the save button, once the add or replace button is clicked */
                  isFormShown: boolean;
                  /** No token saved yet */
                  isAddButtonShown: boolean;
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
    gitProvidersManagement.protectedSelectors.gitProviders,
    cardUiStateByProviderId,
    (errorReason, connections, gitProviders, cardUiStateByProviderId): AccountView => {
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
                                  email: connection.user.email
                              },
                    personalAccessTokenExpirationTime:
                        connection.status !== "connected"
                            ? undefined
                            : connection.personalAccessTokenExpirationTime,
                    serviceTokenLifetimeDays:
                        connection.status === "connected" &&
                        config.authentication.service.type === "scoped-access-token"
                            ? config.authentication.service.lifetimeDays
                            : undefined,
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
                                // A saved token, accepted or not
                                const hasToken = connection.status !== "not connected";
                                const { isEditingPersonalAccessToken } = cardUiState;

                                return {
                                    type: "personal-access-token",
                                    personalAccessTokenCreationUrl:
                                        gitProvider.userConnection.tokenCreationUrl,
                                    isFormShown: isEditingPersonalAccessToken,
                                    isAddButtonShown:
                                        !hasToken && !isEditingPersonalAccessToken,
                                    isReplaceButtonShown:
                                        hasToken && !isEditingPersonalAccessToken,
                                    isCancelButtonShown: isEditingPersonalAccessToken,
                                    isRemoveButtonShown:
                                        !isAddedByUser &&
                                        hasToken &&
                                        !isEditingPersonalAccessToken,
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

/** A provider the launcher offers to connect, with why it can't be used for now */
export type DisconnectedProvider = {
    providerId: string;
    displayName: string;
    type: GitProvidersConfig.ProviderType;
    logoUrl: GitProvidersConfig.LogoUrl | undefined;
    /** oauth: signing in takes a click. personal-access-token: done in Account > Git */
    connectionMethod: AccountView.ProviderCard["authentication"]["type"];
    issue:
        | "not connected"
        | Extract<gitProvidersManagement.Connection, { status: "error" }>["reason"];
    isSigningIn: boolean;
    /** How the last sign in failed */
    error: CardError | undefined;
};

/**
 * In the order of the configuration, undefined until loaded. Without the connections
 * being restored when the use case loads: those are only not known yet.
 */
const disconnectedProviders = createSelector(
    main,
    (view): DisconnectedProvider[] | undefined => {
        if (!view.isReady) {
            return undefined;
        }

        return view.providerCards
            .filter(
                card =>
                    card.status !== "connected" &&
                    (card.status !== "connecting" || card.pendingAction === "sign in")
            )
            .map(
                (card): DisconnectedProvider => ({
                    providerId: card.id,
                    displayName: card.displayName,
                    type: card.type,
                    logoUrl: card.logoUrl,
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

export const selectors = { main, addProviderDialog, disconnectedProviders };
