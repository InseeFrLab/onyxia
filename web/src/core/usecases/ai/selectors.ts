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

const aiOnyxiaContext = createSelector(
    providers,
    activeProviderId,
    (providers, activeProviderId) => {
        const toProviderView = (provider: State.Provider) => {
            // Region providers authenticate via an OIDC-exchanged token; until that
            // exchange succeeds there is no usable key, so the provider isn't ready.
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
                name: provider.kind === "region" ? provider.name : provider.label,
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
