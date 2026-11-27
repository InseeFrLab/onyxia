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
import type { GitForgesConfig } from "core/ports/OnyxiaApi/GitForgesConfig";

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
const forges = createSelector(state, state =>
    state.stateDescription === "ready" ? state.forges : undefined
);

/** GIT_FORGES' description, undefined until the use case has been loaded too. */
const description = createSelector(state, state =>
    state.stateDescription === "ready" ? state.description : undefined
);

/** undefined until the use case has been loaded. In the order of forges. */
const connections = createSelector(
    state,
    (state): { forgeId: string; connection: Connection }[] | undefined => {
        if (state.stateDescription !== "ready") {
            return undefined;
        }

        return state.forges.map(({ config }) => ({
            forgeId: config.id,
            connection: state.connectionByForgeId[config.id] ?? {
                status: "not connected"
            }
        }));
    }
);

export type ConnectedForge = {
    forgeId: string;
    displayName: string;
    type: GitForgesConfig.ForgeType;
    /** Without trailing slash, its repositories' urls start with `${url}/` */
    url: string;
    logoUrl: ThemedAssetUrl | undefined;
    /** Of the account the user is connected with */
    username: string;
};

/** Where a repository can be picked from (launcher), in the order of the configuration. undefined until loaded. */
const connectedForges = createSelector(
    connections,
    forges,
    (connections, forges): ConnectedForge[] | undefined => {
        if (connections === undefined) {
            return undefined;
        }

        assert(forges !== undefined);

        return connections
            .map(({ forgeId, connection }) =>
                connection.status === "connected" ? { forgeId, connection } : undefined
            )
            .filter(exclude(undefined))
            .map(({ forgeId, connection }): ConnectedForge => {
                const entry = forges.find(({ config }) => config.id === forgeId);

                assert(entry !== undefined);

                const { config } = entry;

                return {
                    forgeId,
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
    connectedForges
};

export const protectedSelectors = {
    persistedGitConfig,
    forges,
    description
};
