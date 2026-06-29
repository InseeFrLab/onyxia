import { createSelector } from "clean-architecture";
import type { State as RootState } from "core/bootstrap";
import { name } from "./state";
import type { State } from "./state";

const state = (rootState: RootState) => rootState[name];

const providers = createSelector(state, state =>
    state.stateDescription === "initialized" ? state.providers : undefined
);

const activeProviderId = createSelector(state, state =>
    state.stateDescription === "initialized" ? state.activeProviderId : undefined
);

const main = createSelector(
    state,
    providers,
    activeProviderId,
    (state, providers, activeProviderId) => {
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
            regionProviders: (providers ?? [])
                .filter((p): p is State.Provider.Region => p.kind === "region")
                .map(p => ({
                    ...toCommonView(p),
                    name: p.name,
                    webUiUrl: p.webUiUrl,
                    auth: p.auth
                })),
            customProviders: (providers ?? [])
                .filter((p): p is State.Provider.Custom => p.kind === "custom")
                .map(p => ({
                    ...toCommonView(p),
                    label: p.label,
                    apiKey: p.apiKey
                }))
        };
    }
);

const resolvedActiveProvider = createSelector(
    activeProviderId,
    providers,
    (activeProviderId, providers) => {
        if (activeProviderId === undefined || providers === undefined) return undefined;
        return providers.find(p => p.id === activeProviderId);
    }
);

const aiOnyxiaContext = createSelector(resolvedActiveProvider, provider => {
    if (provider === undefined) return undefined;
    if (provider.models?.stateDescription !== "loaded") return undefined;

    const apiKey = (() => {
        if (provider.kind === "custom") return provider.apiKey;
        if (provider.auth.stateDescription !== "authenticated") return undefined;
        return provider.auth.token;
    })();

    if (apiKey === undefined) return undefined;

    const models = provider.models.availableModels.map(m => m.id);

    const selectedModel = provider.selectedModelId;

    return {
        enabled: true,
        id: provider.id,
        apiKey,
        apiBase: provider.apiBase,
        provider: provider.provider,
        name: provider.kind === "region" ? provider.name : provider.label,
        selectedModel,
        models
    };
});

export const selectors = { main, aiOnyxiaContext };
