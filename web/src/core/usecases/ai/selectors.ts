import { createSelector } from "clean-architecture";
import type { State as RootState } from "core/bootstrap";
import type { XOnyxiaContext } from "core/ports/OnyxiaApi";
import { name } from "./state";
import type { State } from "./state";

const state = (rootState: RootState) => rootState[name];

const main = createSelector(state, state => {
    const providers = state.stateDescription === "initialized" ? state.providers : [];
    const activeProviderId =
        state.stateDescription === "initialized" ? state.activeProviderId : undefined;

    const toCommonView = (provider: State.Provider) => ({
        id: provider.id,
        provider: provider.provider,
        apiBase: provider.apiBase,
        isActive: provider.id === activeProviderId,
        // A provider can only be wired into services once its models are listed.
        canBeActivated: provider.models?.stateDescription === "loaded",
        models: provider.models,
        selectedModelId: provider.selectedModelId
    });

    return {
        stateDescription: state.stateDescription,
        regionProviders: providers
            .filter((p): p is State.Provider.Region => p.kind === "region")
            .map(p => ({
                ...toCommonView(p),
                name: p.name,
                webUiUrl: p.webUiUrl,
                auth: p.auth
            })),
        customProviders: providers
            .filter((p): p is State.Provider.Custom => p.kind === "custom")
            .map(p => ({
                ...toCommonView(p),
                label: p.label,
                apiKey: p.apiKey
            }))
    };
});

/** Credentials usable to call a provider, or undefined when it isn't ready. */
function getProviderApiKey(provider: State.Provider): string | undefined {
    if (provider.kind === "custom") return provider.apiKey;
    if (provider.auth.stateDescription !== "authenticated") return undefined;
    return provider.auth.token;
}

const providers = createSelector(state, state =>
    state.stateDescription === "initialized" ? state.providers : undefined
);

const resolvedActiveProvider = createSelector(
    createSelector(state, state =>
        state.stateDescription === "initialized" ? state.activeProviderId : undefined
    ),
    providers,
    (activeProviderId, providers) => {
        if (activeProviderId === undefined || providers === undefined) return undefined;
        return providers.find(p => p.id === activeProviderId);
    }
);

const activeProvider = createSelector(
    resolvedActiveProvider,
    (provider): XOnyxiaContext["ai"] => {
        if (provider === undefined) return undefined;
        if (provider.models?.stateDescription !== "loaded") return undefined;

        const apiKey = getProviderApiKey(provider);

        if (apiKey === undefined) return undefined;

        const { selectedModelId: selectedModel } = provider;

        // No usable model (e.g. the models list loaded empty) → the provider isn't ready
        // to be wired into services; don't inject an empty model name.
        if (selectedModel === undefined || selectedModel === "") return undefined;

        return {
            enabled: true,
            apiKey,
            apiBase: provider.apiBase,
            model: selectedModel,
            provider: provider.provider
        };
    }
);

export const selectors = { main, activeProvider };
