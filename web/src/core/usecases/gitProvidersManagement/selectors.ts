import { createSelector } from "clean-architecture";
import type { State as RootState } from "core/bootstrap";
import { getRootContext } from "core/rootContext";
import { assert } from "tsafe/assert";
import * as userConfigs from "core/usecases/userConfigs";
import { name, type Connection } from "./state";
import {
    createEmptyPersistedGitConfig,
    parseGitConfigStr
} from "./decoupledLogic/persistedGitConfig";
import { getFavoriteProviderId } from "./decoupledLogic/favoriteProvider";
import { getUserProviderConfig } from "./decoupledLogic/userProviders";
import type { GitProvider } from "core/ports/GitProvider";
import type { GitProvidersConfig } from "core/ports/OnyxiaApi/GitProvidersConfig";

const state = (rootState: RootState) => rootState[name];

const stateDescription = createSelector(state, state => state.stateDescription);

/** undefined unless the use case failed to load. */
const errorReason = createSelector(state, state =>
    state.stateDescription === "error" ? state.reason : undefined
);

/** Empty as long as nothing could be read back, see the "unreadable config" error. */
const persistedGitConfig = createSelector(
    (rootState: RootState) => {
        const { oidc } = getRootContext();

        if (!oidc.isUserLoggedIn) {
            return undefined;
        }

        return userConfigs.selectors.userConfigs(rootState).gitConfigStr;
    },
    gitConfigStr =>
        (gitConfigStr === null || gitConfigStr === undefined
            ? undefined
            : parseGitConfigStr({ gitConfigStr })) ?? createEmptyPersistedGitConfig()
);

export type GitProviderEntry = {
    config: GitProvidersConfig.Provider;
    gitProvider: GitProvider;
    /** Added in Account > Git, not in GIT_PROVIDERS */
    isAddedByUser: boolean;
};

/**
 * The providers of GIT_PROVIDERS, then the ones the user added (ignored when the admin no
 * longer lets the users add theirs). Empty while the user isn't logged in.
 */
const gitProviders = createSelector(
    createSelector(persistedGitConfig, ({ userProviders }) => userProviders),
    (userProviders): GitProviderEntry[] => {
        const { oidc, gitProvidersConfig, createGitProvider } = getRootContext();

        if (!oidc.isUserLoggedIn) {
            return [];
        }

        return [
            ...gitProvidersConfig.providers.map(config => ({
                config,
                isAddedByUser: false
            })),
            ...(gitProvidersConfig.disallowUserToAddProviders ? [] : userProviders).map(
                userProvider => ({
                    config: getUserProviderConfig({ userProvider }),
                    isAddedByUser: true
                })
            )
        ].map(({ config, isAddedByUser }) => ({
            config,
            gitProvider: createGitProvider({ config }),
            isAddedByUser
        }));
    }
);

/** undefined until the use case has been loaded. In the order of gitProviders. */
const connections = createSelector(
    state,
    gitProviders,
    (
        state,
        gitProviders
    ): { providerId: string; connection: Connection }[] | undefined => {
        if (state.stateDescription !== "ready") {
            return undefined;
        }

        return gitProviders.map(({ config }) => ({
            providerId: config.id,
            connection: state.connectionByProviderId[config.id] ?? {
                status: "not connected"
            }
        }));
    }
);

/** undefined while not loaded, or when the user has no choice and nothing connected. */
const favoriteProviderId = createSelector(
    connections,
    persistedGitConfig,
    (connections, persistedGitConfig) =>
        connections === undefined
            ? undefined
            : getFavoriteProviderId({
                  providerIds: connections.map(({ providerId }) => providerId),
                  connectedProviderIds: connections
                      .filter(({ connection }) => connection.status === "connected")
                      .map(({ providerId }) => providerId),
                  favoriteProviderId_persisted: persistedGitConfig.favoriteProviderId
              })
);

export type ConnectedProvider = {
    providerId: string;
    displayName: string;
    type: GitProvidersConfig.ProviderType;
    /** Without trailing slash, its repositories' urls start with `${url}/` */
    url: string;
    logoUrl: GitProvidersConfig.LogoUrl | undefined;
    isFavorite: boolean;
};

/** Where a repository can be picked from (launcher), the favorite first. undefined until loaded. */
const connectedProviders = createSelector(
    connections,
    gitProviders,
    favoriteProviderId,
    (connections, gitProviders, favoriteProviderId): ConnectedProvider[] | undefined => {
        if (connections === undefined) {
            return undefined;
        }

        return connections
            .filter(({ connection }) => connection.status === "connected")
            .map(({ providerId }): ConnectedProvider => {
                const entry = gitProviders.find(({ config }) => config.id === providerId);

                assert(entry !== undefined);

                const { config } = entry;

                return {
                    providerId,
                    displayName: config.displayName,
                    type: config.type,
                    url: config.url,
                    logoUrl: config.logoUrl,
                    isFavorite: providerId === favoriteProviderId
                };
            })
            .sort((a, b) => Number(b.isFavorite) - Number(a.isFavorite));
    }
);

export const selectors = {
    stateDescription,
    errorReason,
    connections,
    favoriteProviderId,
    connectedProviders
};

export const protectedSelectors = {
    persistedGitConfig,
    gitProviders
};
