import { createUsecaseActions } from "clean-architecture";
import { id } from "tsafe/id";
import { assert } from "tsafe/assert";
import type { GitUser } from "core/ports/GitProvider";
import type { LocalizedString } from "core/ports/OnyxiaApi";
import type { GitProvidersConfig } from "core/ports/OnyxiaApi/GitProvidersConfig";

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
        /** GIT_PROVIDERS' description, Markdown written by the admin */
        description: LocalizedString | undefined;
        /**
         * The providers of GIT_PROVIDERS, then the ones the user added (ignored when the
         * admin no longer lets the users add theirs).
         */
        providers: GitProviderEntry[];
        /** Keyed by provider id */
        connectionByProviderId: Record<string, Connection>;
    };
}

/** What is known of a provider without its adapter, see privateThunks.getGitProvider */
export type GitProviderEntry = {
    config: GitProvidersConfig.Provider;
    /** Added in Account > Git, not in GIT_PROVIDERS */
    isAddedByUser: boolean;
    /** How the user connects Onyxia to the provider, see GitProvider.userConnection */
    userConnection:
        | {
              method: "oauth";
              /** Where the user revokes Onyxia on the provider */
              authorizedApplicationsUrl: string;
          }
        | {
              method: "personal-access-token";
              /** Scopes prefilled when the provider allows it */
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
            }: {
                payload: {
                    description: LocalizedString | undefined;
                    providers: GitProviderEntry[];
                    connectionByProviderId: Record<string, Connection>;
                };
            }
        ) =>
            id<State.Ready>({
                stateDescription: "ready",
                description: payload.description,
                providers: payload.providers,
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
        /** By the user, replaces the one with the same id */
        providerAdded: (
            state,
            {
                payload
            }: { payload: { provider: GitProviderEntry; connection: Connection } }
        ) => {
            const { provider, connection } = payload;

            assert(state.stateDescription === "ready");

            state.providers = [
                ...state.providers.filter(
                    ({ config }) => config.id !== provider.config.id
                ),
                provider
            ];
            state.connectionByProviderId[provider.config.id] = connection;
        },
        /** A provider the user had added */
        providerRemoved: (state, { payload }: { payload: { providerId: string } }) => {
            const { providerId } = payload;

            assert(state.stateDescription === "ready");

            state.providers = state.providers.filter(
                ({ config }) => config.id !== providerId
            );
            delete state.connectionByProviderId[providerId];
        }
    }
});
