import { createUsecaseActions } from "clean-architecture";
import type { Ai } from "core/ports/Ai";
import { assert } from "tsafe";
import { id } from "tsafe/id";

export const name = "ai";

type State = State.NotInitialized | State.Error | State.Initialized;

export declare namespace State {
    export type NotInitialized = { stateDescription: "not initialized" };

    export type Error = { stateDescription: "error" };

    export type Initialized = {
        stateDescription: "initialized";
        providers: Provider[];
        activeProviderId: string | undefined;
    };

    // --- Providers ---

    export type Provider = Provider.Region | Provider.Custom;

    export namespace Provider {
        export type Common = {
            id: string;
            name: string;
            apiBase: string;
            /**
             * LLM provider family (e.g. "openai", "anthropic", "gemini"), injected as
             * `ai.provider` in the service launch context. For region providers it
             * comes from the deployment region config; for custom ones the user sets it.
             */
            provider: string;
            models: Models | undefined;
            selectedModelId: string | undefined;
        };

        /** Provisioned by the deployment region, authenticated via the OIDC token. */
        export type Region = Common & {
            kind: "region";
            webUiUrl: string;
            description: Ai["description"];
            accountCreation: Ai["accountCreation"];
            auth:
                | { stateDescription: "no account" }
                | { stateDescription: "error" }
                | { stateDescription: "authenticated"; token: string };
        };

        /** Added by the user, authenticated via a static API key. */
        export type Custom = Common & {
            kind: "custom";
            apiKey: string;
        };
    }

    /** Lifecycle of fetching a provider's `/models` list (undefined = not fetched). */
    export type Models =
        | { stateDescription: "fetching" }
        | { stateDescription: "error" }
        | { stateDescription: "loaded"; availableModels: AiModel[] };

    export type AiModel = { id: string; name: string };
}

export const { reducer, actions } = createUsecaseActions({
    name,
    initialState: id<State>(
        id<State.NotInitialized>({ stateDescription: "not initialized" })
    ),
    reducers: {
        initializationFailed: () => id<State.Error>({ stateDescription: "error" }),
        initialized: (
            _,
            {
                payload
            }: {
                payload: {
                    providers: State.Provider[];
                    activeProviderId: string | undefined;
                };
            }
        ) =>
            id<State.Initialized>({
                stateDescription: "initialized",
                providers: payload.providers,
                activeProviderId: payload.activeProviderId
            }),
        activeProviderChanged: (
            state,
            { payload }: { payload: { activeProviderId: string | undefined } }
        ) => {
            if (state.stateDescription !== "initialized") return;
            state.activeProviderId = payload.activeProviderId;
        },
        regionAuthRefreshed: (
            state,
            {
                payload
            }: { payload: { providerId: string; auth: State.Provider.Region["auth"] } }
        ) => {
            assert(state.stateDescription === "initialized");
            const provider = state.providers.find(p => p.id === payload.providerId);
            if (provider === undefined || provider.kind !== "region") return;
            provider.auth = payload.auth;
        },
        modelsLoaded: (
            state,
            { payload }: { payload: { providerId: string; models: State.AiModel[] } }
        ) => {
            assert(state.stateDescription === "initialized");
            const provider = state.providers.find(p => p.id === payload.providerId);
            if (provider === undefined) return;
            provider.models = {
                stateDescription: "loaded",
                availableModels: payload.models
            };
            // Default the chat model to the first available one if none is set.
            if (provider.selectedModelId === undefined && payload.models.length > 0) {
                provider.selectedModelId = payload.models[0].id;
            }
        },
        modelsFetchFailed: (state, { payload }: { payload: { providerId: string } }) => {
            assert(state.stateDescription === "initialized");
            const provider = state.providers.find(p => p.id === payload.providerId);
            if (provider === undefined) return;
            provider.models = { stateDescription: "error" };
        },
        modelSelected: (
            state,
            { payload }: { payload: { providerId: string; modelId: string } }
        ) => {
            assert(state.stateDescription === "initialized");
            const provider = state.providers.find(p => p.id === payload.providerId);
            // Synchronous user action on a displayed provider: it must exist.
            assert(provider !== undefined);
            provider.selectedModelId = payload.modelId;
        },
        addCustomProvider: (
            state,
            { payload }: { payload: { provider: State.Provider.Custom } }
        ) => {
            assert(state.stateDescription === "initialized");
            state.providers.push(payload.provider);
            state.activeProviderId ??= payload.provider.id;
        },
        editCustomProvider: (
            state,
            {
                payload
            }: {
                payload: {
                    providerId: string;
                    name: string;
                    provider: string;
                    apiBase: string;
                    apiKey: string;
                    models: State.AiModel[];
                    selectedModelId: string;
                };
            }
        ) => {
            assert(state.stateDescription === "initialized");
            const provider = state.providers.find(p => p.id === payload.providerId);
            // Editing an existing custom provider from its dialog: it must exist.
            assert(provider !== undefined);
            assert(provider.kind === "custom");
            provider.name = payload.name;
            provider.provider = payload.provider;
            provider.apiBase = payload.apiBase;
            provider.apiKey = payload.apiKey;
            provider.models = {
                stateDescription: "loaded",
                availableModels: payload.models
            };
            provider.selectedModelId = payload.selectedModelId;
        },
        deleteCustomProvider: (
            state,
            { payload }: { payload: { providerId: string } }
        ) => {
            // Deleting is only reachable from the initialized UI.
            assert(state.stateDescription === "initialized");

            state.providers = state.providers.filter(p => p.id !== payload.providerId);
            if (state.activeProviderId === payload.providerId) {
                state.activeProviderId = state.providers.find(
                    provider =>
                        provider.kind === "custom" ||
                        provider.auth.stateDescription === "authenticated"
                )?.id;
            }
        }
    }
});
