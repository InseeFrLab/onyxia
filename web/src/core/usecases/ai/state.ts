import { createUsecaseActions } from "clean-architecture";
import { assert } from "tsafe";
import { id } from "tsafe/id";

export const name = "ai";

export type AiModel = { id: string; name: string };

/**
 * The chat/embeddings models the user picked on a provider.
 * Kept independently of the catalog so a selection survives a refetch.
 */
export type ModelSelection = {
    modelId: string | undefined;
    embeddingsModelId: string | undefined;
};

/** Lifecycle of fetching the provider's `/models` list. */
export type ModelCatalog =
    | { stateDescription: "not fetched" }
    | { stateDescription: "fetching" }
    | { stateDescription: "error" }
    | { stateDescription: "loaded"; availableModels: AiModel[] };

export type Provider = Provider.Region | Provider.Custom;

export declare namespace Provider {
    /** Provisioned by the deployment region, authenticated via the OIDC token. */
    export type Region = {
        kind: "region";
        id: string;
        name: string;
        webUiUrl: string;
        apiBase: string;
        auth:
            | { stateDescription: "no account" }
            | { stateDescription: "error" }
            | {
                  stateDescription: "authenticated";
                  /** undefined only while a refresh is in flight. */
                  token: string | undefined;
              };
        modelCatalog: ModelCatalog;
        selection: ModelSelection;
    };

    /** Added by the user, authenticated via a static API key. */
    export type Custom = {
        kind: "custom";
        id: string;
        label: string;
        apiBase: string;
        apiKey: string;
        modelCatalog: ModelCatalog;
        selection: ModelSelection;
    };
}

/** Which provider, if any, is wired into the user's services. */
export type ActiveProvider = { kind: "none" } | { kind: "provider"; providerId: string };

type State = State.NotInitialized | State.Initialized;

export declare namespace State {
    export type NotInitialized = {
        isInitialized: false;
        isInitializing: boolean;
    };

    export type Initialized = {
        isInitialized: true;
        providers: Provider[];
        activeProvider: ActiveProvider;
    };
}

export const { reducer, actions } = createUsecaseActions({
    name,
    initialState: id<State>(
        id<State.NotInitialized>({ isInitialized: false, isInitializing: false })
    ),
    reducers: {
        initializeStarted: () =>
            id<State.NotInitialized>({ isInitialized: false, isInitializing: true }),
        initialized: (
            _,
            {
                payload
            }: {
                payload: { providers: Provider[]; activeProvider: ActiveProvider };
            }
        ) =>
            id<State.Initialized>({
                isInitialized: true,
                providers: payload.providers,
                activeProvider: payload.activeProvider
            }),
        activeProviderChanged: (
            state,
            { payload }: { payload: { activeProvider: ActiveProvider } }
        ) => {
            if (!state.isInitialized) return;
            state.activeProvider = payload.activeProvider;
        },
        regionTokenRefreshed: (
            state,
            { payload }: { payload: { providerId: string; token: string | undefined } }
        ) => {
            if (!state.isInitialized) return;
            const provider = state.providers.find(p => p.id === payload.providerId);
            if (provider?.kind !== "region") return;
            if (provider.auth.stateDescription !== "authenticated") return;
            provider.auth.token = payload.token;
        },
        modelCatalogFetchStarted: (
            state,
            { payload }: { payload: { providerId: string } }
        ) => {
            if (!state.isInitialized) return;
            const provider = state.providers.find(p => p.id === payload.providerId);
            if (provider === undefined) return;
            provider.modelCatalog = { stateDescription: "fetching" };
        },
        modelCatalogLoaded: (
            state,
            { payload }: { payload: { providerId: string; models: AiModel[] } }
        ) => {
            if (!state.isInitialized) return;
            const provider = state.providers.find(p => p.id === payload.providerId);
            if (provider === undefined) return;
            provider.modelCatalog = {
                stateDescription: "loaded",
                availableModels: payload.models
            };
            // Default the chat model to the first available one if none is set.
            if (provider.selection.modelId === undefined && payload.models.length > 0) {
                provider.selection.modelId = payload.models[0].id;
            }
        },
        modelCatalogFetchFailed: (
            state,
            { payload }: { payload: { providerId: string } }
        ) => {
            if (!state.isInitialized) return;
            const provider = state.providers.find(p => p.id === payload.providerId);
            assert(provider !== undefined, "Provider should not be undefined");
            provider.modelCatalog = { stateDescription: "error" };
        },
        modelSelected: (
            state,
            { payload }: { payload: { providerId: string; modelId: string } }
        ) => {
            if (!state.isInitialized) return;
            const provider = state.providers.find(p => p.id === payload.providerId);
            assert(provider !== undefined, "Provider should not be undefined");
            provider.selection.modelId = payload.modelId;
        },
        embeddingsModelSelected: (
            state,
            { payload }: { payload: { providerId: string; modelId: string } }
        ) => {
            if (!state.isInitialized) return;
            const provider = state.providers.find(p => p.id === payload.providerId);
            assert(provider !== undefined, "Provider should not be undefined");
            provider.selection.embeddingsModelId = payload.modelId;
        },
        customProviderAdded: (
            state,
            { payload }: { payload: { provider: Provider.Custom } }
        ) => {
            if (!state.isInitialized) return;
            state.providers.push(payload.provider);
        },
        customProviderEdited: (
            state,
            {
                payload
            }: {
                payload: {
                    providerId: string;
                    label: string;
                    apiBase: string;
                    apiKey: string;
                };
            }
        ) => {
            if (!state.isInitialized) return;
            const provider = state.providers.find(p => p.id === payload.providerId);
            assert(provider !== undefined, "Provider should not be undefined");
            assert(provider.kind === "custom", "Provider should be custom");
            provider.label = payload.label;
            provider.apiBase = payload.apiBase;
            provider.apiKey = payload.apiKey;
            // Credentials changed → the previous catalog no longer applies.
            provider.modelCatalog = { stateDescription: "fetching" };
        },
        customProviderDeleted: (
            state,
            { payload }: { payload: { providerId: string } }
        ) => {
            assert(state.isInitialized, "state should be initialized");

            state.providers = state.providers.filter(p => p.id !== payload.providerId);
            if (
                state.activeProvider.kind === "provider" &&
                state.activeProvider.providerId === payload.providerId
            ) {
                state.activeProvider = { kind: "none" };
            }
        }
    }
});
