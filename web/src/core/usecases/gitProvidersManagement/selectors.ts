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

/** undefined until the use case has been loaded. In the order of the configuration. */
const connections = createSelector(
    state,
    (state): { providerId: string; connection: Connection }[] | undefined => {
        if (state.stateDescription !== "ready") {
            return undefined;
        }

        return getRootContext().gitProviders.map(gitProvider => ({
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

/** The identity used when git.name / git.email are left empty. */
const favoriteUser = createSelector(
    connections,
    favoriteProviderId,
    (connections, favoriteProviderId) => {
        const connection = connections?.find(
            ({ providerId }) => providerId === favoriteProviderId
        )?.connection;

        return connection?.status === "connected" ? connection.user : undefined;
    }
);

export const selectors = {
    stateDescription,
    errorReason,
    connections,
    favoriteProviderId,
    favoriteUser
};

export const protectedSelectors = {
    persistedGitConfig
};
