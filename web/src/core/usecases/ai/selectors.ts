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
            isDefault: provider.id === activeProviderId,
            models: provider.models,
            selectedModelId: provider.selectedModelId,
            name: provider.name
        });

        return {
            stateDescription: state.stateDescription,
            regionProviders: (providers ?? [])
                .filter((p): p is State.Provider.Region => p.kind === "region")
                .map(p => ({
                    ...toCommonView(p),
                    webUiUrl: p.webUiUrl,
                    description: p.description,
                    accountCreation: p.accountCreation,
                    auth: p.auth
                })),
            customProviders: (providers ?? [])
                .filter((p): p is State.Provider.Custom => p.kind === "custom")
                .map(p => ({
                    ...toCommonView(p),
                    apiKey: p.apiKey
                }))
        };
    }
);

const aiOnyxiaContext = createSelector(
    providers,
    activeProviderId,
    (providers, activeProviderId) => {
        const toProviderView = (provider: State.Provider) => {
            const apiKey = (() => {
                if (provider.kind === "custom") return provider.apiKey;
                if (provider.auth.stateDescription !== "authenticated") return undefined;
                return provider.auth.token;
            })();

            // A provider is only usable once authenticated. Its models may not be
            // listed yet (fetch still pending or failed) — that's fine, `models` is
            // left undefined in that case.
            if (apiKey === undefined) return undefined;

            const models =
                provider.models?.stateDescription === "loaded"
                    ? provider.models.availableModels.map(({ id }) => id)
                    : undefined;

            return {
                id: provider.id,
                isDefault: provider.id === activeProviderId,
                name: provider.name,
                provider: provider.provider,
                apiBase: provider.apiBase,
                apiKey,
                models,
                selectedModel: provider.selectedModelId
            };
        };

        const providerViews = (providers ?? [])
            .map(toProviderView)
            .filter(view => view !== undefined);

        return {
            enabled: providerViews.length > 0,
            activeProvider: providerViews.find(p => p.id === activeProviderId),
            providers: providerViews.filter(p => p.id !== activeProviderId)
        };
    }
);

export const selectors = { main, aiOnyxiaContext };
