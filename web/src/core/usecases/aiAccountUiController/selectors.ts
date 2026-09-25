import { createSelector } from "clean-architecture";
import type { State as RootState } from "core/bootstrap";
import * as aiProvidersManagements from "core/usecases/aiProvidersManagements";
import {
    stringifyModel,
    getProviderConnectionState
} from "core/usecases/aiProvidersManagements";
import { getRootContext } from "core/rootContext";
import { name } from "./state";

const state = (rootState: RootState) => rootState[name];

const main = createSelector(
    state,
    aiProvidersManagements.selectors.stateDescription,
    aiProvidersManagements.selectors.errorReason,
    aiProvidersManagements.selectors.aiProviders,
    aiProvidersManagements.selectors.defaultModel,
    aiProvidersManagements.selectors.configSaveState,
    (
        state,
        stateDescription,
        errorReason,
        aiProviders,
        defaultModel,
        configSaveState
    ) => {
        if (aiProviders === undefined) {
            return {
                stateDescription,
                isReady: false as const,
                /** The stored config can't be read back, it can only be reset. */
                isConfigUnreadable: errorReason === "unreadable config"
            };
        }

        const providers = aiProviders.map(aiProvider => ({
            ...aiProvider,
            operationState: state.operationByProviderName[aiProvider.name] ?? "idle",
            connectionState: getProviderConnectionState({
                // Whether the provider could be reached, even if its models are pinned
                connection:
                    aiProvider.auth.stateDescription === "error" ||
                    aiProvider.modelsListing.stateDescription === "error"
                        ? "failed"
                        : aiProvider.modelsListing.stateDescription === "loaded"
                          ? "succeeded"
                          : aiProvider.auth.stateDescription === "fetching" ||
                              aiProvider.modelsListing.stateDescription === "fetching"
                            ? "testing"
                            : "not tested"
            }),
            canRefreshToken:
                aiProvider.origin === "configured by admin" &&
                aiProvider.authentification.type === "api-key" &&
                aiProvider.authentification.obtentionMethod ===
                    "open-webui-oidc-token-exchange"
        }));

        // The default model is picked among what the user ticked, across all providers.
        const defaultModelOptionGroups = providers
            .filter(provider => provider.selectedModelIds.length !== 0)
            .map(provider => ({
                providerName: provider.name,
                options: provider.selectedModelIds.map(modelId => ({
                    value: stringifyModel({
                        providerName: provider.name,
                        modelId
                    }),
                    modelId
                }))
            }));

        return {
            stateDescription,
            isReady: true as const,
            providers,
            defaultModelOptionGroups,
            /** Markdown written by the admin in the instance configuration */
            description: getRootContext().aiConfig.description,
            defaultModel:
                defaultModel === undefined ? undefined : stringifyModel(defaultModel),
            configSaveState
        };
    }
);

export const selectors = { main };
