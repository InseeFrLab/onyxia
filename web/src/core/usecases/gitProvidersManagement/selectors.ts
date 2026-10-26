import { createSelector } from "clean-architecture";
import type { State as RootState } from "core/bootstrap";
import { getRootContext } from "core/rootContext";
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

        return gitProviders.map(({ gitProvider }) => ({
            providerId: gitProvider.id,
            connection: state.connectionByProviderId[gitProvider.id] ?? {
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

export const selectors = {
    stateDescription,
    errorReason,
    connections,
    favoriteProviderId
};

export const protectedSelectors = {
    persistedGitConfig,
    gitProviders
};
