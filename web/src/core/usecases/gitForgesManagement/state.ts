import { createUsecaseActions } from "clean-architecture";
import { id } from "tsafe/id";
import { assert } from "tsafe/assert";
import type { GitUser } from "core/ports/GitForge";
import type { LocalizedString } from "core/ports/OnyxiaApi";
import type { GitForgesConfig } from "core/ports/OnyxiaApi/GitForgesConfig";

export const name = "gitForgesManagement";

/** The secrets (PAT, access and refresh tokens) are never in the state. */
export type State = State.NotLoaded | State.Loading | State.Error | State.Ready;

export declare namespace State {
    export type NotLoaded = { stateDescription: "not loaded" };

    export type Loading = { stateDescription: "loading" };

    export type Error = {
        stateDescription: "error";
        /**
         * "unreadable config": the user's persisted config could not be read back, it
         * has to be reset before anything can be shown.
         */
        reason: "unreadable config" | "loading failed";
    };

    export type Ready = {
        stateDescription: "ready";
        /** GIT_FORGES' description, Markdown written by the admin */
        description: LocalizedString | undefined;
        /**
         * The forges of GIT_FORGES, then the ones the user added (ignored when the
         * admin no longer lets the users add theirs).
         */
        forges: GitForgeEntry[];
        /** Keyed by forge id */
        connectionByForgeId: Record<string, Connection>;
    };
}

/** What is known of a forge without its adapter, see privateThunks.getGitForge */
export type GitForgeEntry = {
    config: GitForgesConfig.Forge;
    /** Added in Account > Git, not in GIT_FORGES */
    isAddedByUser: boolean;
    /** How the user connects Onyxia to the forge, see GitForge.userConnection */
    userConnection:
        | {
              method: "oauth";
              /** Where the user revokes Onyxia on the forge */
              authorizedApplicationsUrl: string;
          }
        | {
              method: "personal-access-token";
              /** Scopes prefilled when the forge allows it */
              tokenCreationUrl: string;
          };
};

export type Connection =
    | { status: "not connected" }
    | { status: "connecting" }
    | {
          status: "connected";
          user: GitUser;
          /** Unix time in ms. undefined: no personal access token, no expiration, or not known */
          personalAccessTokenExpirationTime: number | undefined;
      }
    | {
          status: "error";
          /**
           * - "personal access token rejected": the card offers to replace it.
           * - "session expired": the OAuth refresh failed, the card offers to sign in again.
           * - "loading failed": the forge couldn't be reached.
           */
          reason: "personal access token rejected" | "session expired" | "loading failed";
      };

export const { reducer, actions } = createUsecaseActions({
    name,
    initialState: id<State>(id<State.NotLoaded>({ stateDescription: "not loaded" })),
    reducers: {
        loadingStarted: () => id<State.Loading>({ stateDescription: "loading" }),
        loadingFailed: (
            _state,
            { payload }: { payload: { reason: State.Error["reason"] } }
        ) => id<State.Error>({ stateDescription: "error", reason: payload.reason }),
        loaded: (
            _state,
            {
                payload
            }: {
                payload: {
                    description: LocalizedString | undefined;
                    forges: GitForgeEntry[];
                    connectionByForgeId: Record<string, Connection>;
                };
            }
        ) =>
            id<State.Ready>({
                stateDescription: "ready",
                description: payload.description,
                forges: payload.forges,
                connectionByForgeId: payload.connectionByForgeId
            }),
        connectionChanged: (
            state,
            { payload }: { payload: { forgeId: string; connection: Connection } }
        ) => {
            const { forgeId, connection } = payload;

            assert(state.stateDescription === "ready");

            state.connectionByForgeId[forgeId] = connection;
        },
        /** By the user, replaces the one with the same id */
        forgeAdded: (
            state,
            { payload }: { payload: { forge: GitForgeEntry; connection: Connection } }
        ) => {
            const { forge, connection } = payload;

            assert(state.stateDescription === "ready");

            state.forges = [
                ...state.forges.filter(({ config }) => config.id !== forge.config.id),
                forge
            ];
            state.connectionByForgeId[forge.config.id] = connection;
        },
        /** A forge the user added, edited: in place, its id may have changed with its url */
        forgeUpdated: (
            state,
            {
                payload
            }: {
                payload: {
                    forgeId_before: string;
                    forge: GitForgeEntry;
                    connection: Connection;
                };
            }
        ) => {
            const { forgeId_before, forge, connection } = payload;

            assert(state.stateDescription === "ready");

            state.forges = state.forges.map(forge_i =>
                forge_i.config.id === forgeId_before ? forge : forge_i
            );
            delete state.connectionByForgeId[forgeId_before];
            state.connectionByForgeId[forge.config.id] = connection;
        },
        /** A forge the user had added */
        forgeRemoved: (state, { payload }: { payload: { forgeId: string } }) => {
            const { forgeId } = payload;

            assert(state.stateDescription === "ready");

            state.forges = state.forges.filter(({ config }) => config.id !== forgeId);
            delete state.connectionByForgeId[forgeId];
        }
    }
});
