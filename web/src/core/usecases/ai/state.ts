import { createUsecaseActions } from "clean-architecture";
import type { AiGateway } from "core/ports/AiGateway";
import { assert } from "tsafe";
import { id } from "tsafe/id";

export const name = "ai";

type State = State.NotInitialized | State.Error | State.Initialized;

export declare namespace State {
    export type NotInitialized = { stateDescription: "not initialized" };

    export type Error = { stateDescription: "error" };

    export type Initialized = {
        stateDescription: "initialized";
        providers: AiProvider[];
        activeProviderId: string | undefined;
    };

    // --- AI providers ---

    export type AiProvider = AiProvider.Managed | AiProvider.Custom;

    export namespace AiProvider {
        export type Common = {
            id: string;
            name: string;
            apiBase: string;
            /** Wire protocol used by the provider API (for example OpenAI or Anthropic). */
            protocol: string;
            models: Models | undefined;
            selectedModelId: string | undefined;
        };

        /** Provisioned by the instance configuration, authenticated via OIDC. */
        export type Managed = Common & {
            kind: "managed";
            webUiUrl: string;
            description: AiGateway["description"];
            accountCreation: AiGateway["accountCreation"];
            auth:
                | { stateDescription: "fetching" }
                | { stateDescription: "no account" }
                | { stateDescription: "error" }
                | { stateDescription: "authenticated"; accessToken: string };
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
                    providers: State.AiProvider[];
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
            assert(state.stateDescription === "initialized");
            state.activeProviderId = payload.activeProviderId;
        },
        managedAuthFetchStarted: (
            state,
            { payload }: { payload: { providerId: string } }
        ) => {
            assert(state.stateDescription === "initialized");
            const provider = state.providers.find(p => p.id === payload.providerId);
            if (provider === undefined || provider.kind !== "managed") return;
            provider.auth = { stateDescription: "fetching" };
        },
        managedAuthRefreshed: (
            state,
            {
                payload
            }: {
                payload: {
                    providerId: string;
                    auth: State.AiProvider.Managed["auth"];
                };
            }
        ) => {
            assert(state.stateDescription === "initialized");
            const provider = state.providers.find(p => p.id === payload.providerId);
            if (provider === undefined || provider.kind !== "managed") return;
            provider.auth = payload.auth;
        },
        modelsFetchStarted: (state, { payload }: { payload: { providerId: string } }) => {
            assert(state.stateDescription === "initialized");
            const provider = state.providers.find(p => p.id === payload.providerId);
            if (provider === undefined) return;
            provider.models = { stateDescription: "fetching" };
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
            const selectedModelIsAvailable = payload.models.some(
                model => model.id === provider.selectedModelId
            );
            provider.selectedModelId = selectedModelIsAvailable
                ? provider.selectedModelId
                : payload.models[0]?.id;
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
            assert(provider !== undefined);
            provider.selectedModelId = payload.modelId;
        },
        addCustomProvider: (
            state,
            { payload }: { payload: { aiProvider: State.AiProvider.Custom } }
        ) => {
            assert(state.stateDescription === "initialized");
            state.providers.push(payload.aiProvider);
            state.activeProviderId ??= payload.aiProvider.id;
        },
        editCustomProvider: (
            state,
            {
                payload
            }: {
                payload: {
                    providerId: string;
                    name: string;
                    protocol: string;
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
            provider.protocol = payload.protocol;
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
