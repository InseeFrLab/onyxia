import { createUsecaseActions } from "clean-architecture";
import { id } from "tsafe/id";
import { assert } from "tsafe/assert";
import type { GitUser } from "core/ports/GitProvider";

export const name = "gitProvidersManagement";

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
        /** Keyed by provider id, of GIT_PROVIDERS or added by the user */
        connectionByProviderId: Record<string, Connection>;
    };
}

export type Connection =
    | { status: "not connected" }
    | { status: "connecting" }
    | { status: "connected"; user: GitUser }
    | {
          status: "error";
          /**
           * - "personal access token rejected": the card offers to replace it.
           * - "session expired": the OAuth refresh failed, the card offers to sign in again.
           * - "loading failed": the provider couldn't be reached.
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
            }: { payload: { connectionByProviderId: Record<string, Connection> } }
        ) =>
            id<State.Ready>({
                stateDescription: "ready",
                connectionByProviderId: payload.connectionByProviderId
            }),
        connectionChanged: (
            state,
            { payload }: { payload: { providerId: string; connection: Connection } }
        ) => {
            const { providerId, connection } = payload;

            assert(state.stateDescription === "ready");

            state.connectionByProviderId[providerId] = connection;
        },
        /** A provider the user had added */
        providerRemoved: (state, { payload }: { payload: { providerId: string } }) => {
            assert(state.stateDescription === "ready");

            delete state.connectionByProviderId[payload.providerId];
        }
    }
});
