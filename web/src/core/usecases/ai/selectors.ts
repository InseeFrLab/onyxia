import { createSelector } from "clean-architecture";
import type { State as RootState } from "core/bootstrap";
import type { XOnyxiaContext } from "core/ports/OnyxiaApi";
import { name } from "./state";
import type { Provider } from "./state";

const state = (rootState: RootState) => rootState[name];

const main = createSelector(state, state => {
    if (!state.isInitialized) {
        return {
            isInitialized: false as const,
            isInitializing: state.isInitializing
        };
    }

    return {
        isInitialized: true as const,
        providers: state.providers,
        activeProvider: state.activeProvider
    };
});

/** Display name of a provider, whatever its kind. */
function getProviderName(provider: Provider): string {
    return provider.kind === "region" ? provider.name : provider.label;
}

/** Credentials usable to call a provider, or undefined when it isn't ready. */
function getProviderApiKey(provider: Provider): string | undefined {
    if (provider.kind === "custom") return provider.apiKey;
    if (provider.auth.stateDescription !== "authenticated") return undefined;
    return provider.auth.token;
}

const activeProvider = createSelector(state, (state): XOnyxiaContext["ai"] => {
    if (!state.isInitialized) return undefined;

    const { providers, activeProvider } = state;

    if (activeProvider.kind === "none") return undefined;

    const provider = providers.find(p => p.id === activeProvider.providerId);

    if (provider === undefined) return undefined;
    if (provider.modelCatalog.stateDescription !== "loaded") return undefined;

    const apiKey = getProviderApiKey(provider);

    if (apiKey === undefined) return undefined;

    return {
        enabled: true,
        apiKey,
        apiBase: provider.apiBase,
        model: provider.selection.modelId ?? "",
        embeddingsModel: provider.selection.embeddingsModelId ?? "",
        provider: getProviderName(provider)
    };
});

export const selectors = { main, activeProvider };
