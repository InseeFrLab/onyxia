import { createSelector } from "clean-architecture";
import type { State as RootState } from "core/bootstrap";
import * as aiProvidersManagements from "core/usecases/aiProvidersManagements";
import { stringifyModel } from "core/usecases/aiProvidersManagements";
import { name } from "./state";

const state = (rootState: RootState) => rootState[name];

const main = createSelector(
    state,
    aiProvidersManagements.selectors.stateDescription,
    aiProvidersManagements.selectors.aiProviders,
    aiProvidersManagements.selectors.defaultModel,
    aiProvidersManagements.protectedSelectors.persistedAiConfig,
    aiProvidersManagements.selectors.configSaveState,
    (
        state,
        stateDescription,
        aiProviders,
        defaultModel,
        persistedAiConfig,
        configSaveState
    ) => {
        if (aiProviders === undefined) {
            return {
                stateDescription,
                isReady: false as const
            };
        }

        const providers = aiProviders.map(aiProvider => ({
            ...aiProvider,
            operationState: state.operationByProviderName[aiProvider.name] ?? "idle",
            userProvidedApiKey:
                persistedAiConfig.apiKeyByProviderName[aiProvider.name] ?? "",
            canRefreshToken:
                aiProvider.origin === "configured by admin" &&
                aiProvider.authentification.type === "api-key" &&
                aiProvider.authentification.obtentionMethod ===
                    "open-webui-oidc-token-exchange",
            /** The user has a key to type in for this provider. */
            canUserProvideApiKey:
                aiProvider.origin === "configured by admin" &&
                aiProvider.authentification.type === "api-key" &&
                (aiProvider.authentification.obtentionMethod === "user-provided" ||
                    aiProvider.authentification.allowFallbackToUserProvidedApiKey),
            /** The user has to go through this provider's own login flow. */
            canUserLogIn:
                aiProvider.origin === "configured by admin" &&
                aiProvider.authentification.type === "api-key" &&
                aiProvider.authentification.obtentionMethod ===
                    "open-webui-oidc-token-exchange"
        }));

        // The default model is picked among what the user ticked, across all providers.
        const defaultModelOptions = providers
            .map(provider =>
                provider.selectedModelIds.map(modelId => ({
                    value: stringifyModel({
                        providerName: provider.name,
                        modelId
                    }),
                    providerName: provider.name,
                    modelId
                }))
            )
            .flat();

        return {
            stateDescription,
            isReady: true as const,
            providers,
            defaultModelOptions,
            defaultModel:
                defaultModel === undefined ? undefined : stringifyModel(defaultModel),
            configSaveState
        };
    }
);

export const selectors = { main };
