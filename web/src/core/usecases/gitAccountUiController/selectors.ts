import { createSelector } from "clean-architecture";
import type { LocalizedString } from "core/ports/OnyxiaApi";
import type { GitProvidersConfig } from "core/ports/OnyxiaApi/GitProvidersConfig";
import * as gitProvidersManagement from "core/usecases/gitProvidersManagement";
import { getRootContext } from "core/rootContext";
import { assert } from "tsafe/assert";

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
        /** undefined: no choice and nothing connected */
        favoriteProviderId: string | undefined;
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
        /** Its identity (connection.user) is the one used when launching a service */
        isFavorite: boolean;
        connection: gitProvidersManagement.Connection;
        authentication:
            | {
                  type: "oauth";
                  /**
                   * undefined: signing out revokes the grant on the provider. Otherwise,
                   * where the user revokes it themselves (Forgejo).
                   */
                  authorizedApplicationsUrl: string | undefined;
              }
            | {
                  type: "personal-access-token";
                  personalAccessTokenCreationUrl: string;
              };
    };
}

const main = createSelector(
    gitProvidersManagement.selectors.errorReason,
    gitProvidersManagement.selectors.connections,
    gitProvidersManagement.selectors.favoriteProviderId,
    (errorReason, connections, favoriteProviderId): AccountView => {
        if (connections === undefined) {
            return {
                isReady: false,
                stateDescription: errorReason ?? "loading"
            };
        }

        const { gitProviders, gitProvidersConfig } = getRootContext();

        const providerCards = connections.map(
            ({ providerId, connection }): AccountView.ProviderCard => {
                const gitProvider = gitProviders.find(({ id }) => id === providerId);
                const config = gitProvidersConfig.providers.find(
                    ({ id }) => id === providerId
                );

                assert(gitProvider !== undefined && config !== undefined);

                return {
                    id: providerId,
                    displayName: gitProvider.displayName,
                    type: config.type,
                    url: gitProvider.url,
                    logoUrl: config.logoUrl,
                    documentation: config.documentation,
                    isFavorite: providerId === favoriteProviderId,
                    connection,
                    authentication:
                        gitProvider.ui.type === "oauth"
                            ? {
                                  type: "oauth",
                                  authorizedApplicationsUrl:
                                      gitProvider.ui.oauth.revokeTokens === undefined
                                          ? gitProvider.ui.oauth.authorizedApplicationsUrl
                                          : undefined
                              }
                            : {
                                  type: "personal-access-token",
                                  personalAccessTokenCreationUrl:
                                      gitProvider.ui.personalAccessTokenCreationUrl
                              }
                };
            }
        );

        return {
            isReady: true,
            description: gitProvidersConfig.description,
            favoriteProviderId,
            providerCards
        };
    }
);

export const selectors = { main };
