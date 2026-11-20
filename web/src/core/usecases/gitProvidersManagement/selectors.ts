import { exclude } from "tsafe/exclude";
import { createSelector } from "clean-architecture";
import type { State as RootState } from "core/bootstrap";
import type { ThemedAssetUrl } from "onyxia-ui";
import { assert } from "tsafe/assert";
import * as userConfigs from "core/usecases/userConfigs";
import { name, type Connection } from "./state";
import {
    createEmptyPersistedGitConfig,
    parseGitConfigStr
} from "./decoupledLogic/persistedGitConfig";
import type { GitProvidersConfig } from "core/ports/OnyxiaApi/GitProvidersConfig";

const state = (rootState: RootState) => rootState[name];

const stateDescription = createSelector(state, state => state.stateDescription);

/** undefined unless the use case failed to load. */
const errorReason = createSelector(state, state =>
    state.stateDescription === "error" ? state.reason : undefined
);

/**
 * Empty as long as nothing could be read back, see the "unreadable config" error.
 * The user must be logged in.
 */
const persistedGitConfig = createSelector(
    (rootState: RootState) => userConfigs.selectors.userConfigs(rootState).gitConfigStr,
    gitConfigStr =>
        (gitConfigStr === null ? undefined : parseGitConfigStr({ gitConfigStr })) ??
        createEmptyPersistedGitConfig()
);

/** In the order of the configuration, undefined until the use case has been loaded. */
const providers = createSelector(state, state =>
    state.stateDescription === "ready" ? state.providers : undefined
);

/** GIT_PROVIDERS' description, undefined until the use case has been loaded too. */
const description = createSelector(state, state =>
    state.stateDescription === "ready" ? state.description : undefined
);

/** undefined until the use case has been loaded. In the order of providers. */
const connections = createSelector(
    state,
    (state): { providerId: string; connection: Connection }[] | undefined => {
        if (state.stateDescription !== "ready") {
            return undefined;
        }

        return state.providers.map(({ config }) => ({
            providerId: config.id,
            connection: state.connectionByProviderId[config.id] ?? {
                status: "not connected"
            }
        }));
    }
);

/**
 * The first connected provider, in the order of the configuration: its identity fills the
 * deprecated single forge fields (git.name, git.email, git.token).
 * undefined while not loaded, or when nothing is connected.
 */
const primaryProviderId = createSelector(
    connections,
    connections =>
        connections?.find(({ connection }) => connection.status === "connected")
            ?.providerId
);

export type ConnectedProvider = {
    providerId: string;
    displayName: string;
    type: GitProvidersConfig.ProviderType;
    /** Without trailing slash, its repositories' urls start with `${url}/` */
    url: string;
    logoUrl: ThemedAssetUrl | undefined;
    /** Of the account the user is connected with */
    username: string;
};

/** Where a repository can be picked from (launcher), in the order of the configuration. undefined until loaded. */
const connectedProviders = createSelector(
    connections,
    providers,
    (connections, providers): ConnectedProvider[] | undefined => {
        if (connections === undefined) {
            return undefined;
        }

        assert(providers !== undefined);

        return connections
            .map(({ providerId, connection }) =>
                connection.status === "connected" ? { providerId, connection } : undefined
            )
            .filter(exclude(undefined))
            .map(({ providerId, connection }): ConnectedProvider => {
                const entry = providers.find(({ config }) => config.id === providerId);

                assert(entry !== undefined);

                const { config } = entry;

                return {
                    providerId,
                    displayName: config.displayName,
                    type: config.type,
                    url: config.url,
                    logoUrl: config.logoUrl,
                    username: connection.user.username
                };
            });
    }
);

export const selectors = {
    stateDescription,
    errorReason,
    connections,
    primaryProviderId,
    connectedProviders
};

export const protectedSelectors = {
    persistedGitConfig,
    providers,
    description
};
