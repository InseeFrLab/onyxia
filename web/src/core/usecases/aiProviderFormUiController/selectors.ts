import { createSelector } from "clean-architecture";
import type { State as RootState } from "core/bootstrap";
import * as aiProvidersManagements from "core/usecases/aiProvidersManagements";
import {
    supportedAiProviderTypes,
    getSelectedModelIds,
    getProviderConnectionState
} from "core/usecases/aiProvidersManagements/decoupledLogic";
import { name } from "./state";

const state = (rootState: RootState) => rootState[name];

const main = createSelector(
    state,
    aiProvidersManagements.selectors.aiProviders,
    aiProvidersManagements.protectedSelectors.persistedAiConfig,
    (state, aiProviders, persistedAiConfig) => {
        if (state.stateDescription === "closed") {
            return { isOpen: false as const };
        }

        const { formValues, providerName_current, providerOrigin } = state;

        const isConfiguredByAdmin = providerOrigin === "configured by admin";

        const aiProvider_current =
            providerName_current === undefined
                ? undefined
                : aiProviders?.find(
                      aiProvider => aiProvider.name === providerName_current
                  );

        const canEditApiKey =
            !isConfiguredByAdmin ||
            (aiProvider_current?.origin === "configured by admin" &&
                aiProvider_current.authentification.type === "api-key" &&
                aiProvider_current.authentification.obtentionMethod === "user-provided");

        const providerName = formValues.name.trim();

        // What the admin configured isn't editable, hence always valid
        const isNameValid = isConfiguredByAdmin
            ? true
            : providerName !== "" &&
              !providerName.includes("/") &&
              // The name is the provider's id, it has to stay unique.
              !(aiProviders ?? []).some(
                  aiProvider =>
                      aiProvider.name === providerName &&
                      aiProvider.name !== providerName_current
              );

        const isApiBaseValid = (() => {
            if (isConfiguredByAdmin) {
                return true;
            }

            let url: URL;

            try {
                url = new URL(formValues.apiBase.trim());
            } catch {
                return false;
            }

            return url.protocol === "http:" || url.protocol === "https:";
        })();

        // Normalized the way they are when saved
        const isConnectionSaved =
            aiProvider_current !== undefined &&
            formValues.providerType === aiProvider_current.providerType &&
            formValues.apiBase.trim().replace(/\/+$/, "") ===
                aiProvider_current.apiBase &&
            formValues.apiKey.trim() ===
                (persistedAiConfig.apiKeyByProviderName[aiProvider_current.name] ?? "");

        /**
         * The models the user can pick from: the ones listed by the last successful
         * test, or else the ones pinned by the admin, which are offered anyway.
         */
        const availableModels =
            state.connectionTest.stateDescription === "succeeded"
                ? state.connectionTest.availableModels
                : aiProvider_current?.origin === "configured by admin" &&
                    aiProvider_current.modelIds !== undefined
                  ? aiProvider_current.modelIds.map(id => ({ id }))
                  : undefined;

        /**
         * When the listed models are the ones of the saved configuration, picking some is
         * saved right away, like from the provider card. Otherwise the selection depends
         * on unsaved values and is saved along with them.
         */
        const selectedModelIds_draft =
            availableModels === undefined
                ? []
                : getSelectedModelIds({
                      availableModels,
                      excludedModelIds: state.excludedModelIds_draft
                  });

        const isModelSelectionSavedImmediately =
            isConnectionSaved &&
            aiProvider_current !== undefined &&
            aiProvider_current.models.stateDescription === "loaded" &&
            availableModels !== undefined;

        const hasChanges = (() => {
            // Nothing is saved yet, there is nothing to compare with
            if (aiProvider_current === undefined) {
                return true;
            }

            if (
                selectedModelIds_draft.length !==
                    aiProvider_current.selectedModelIds.length ||
                aiProvider_current.selectedModelIds.some(
                    modelId => !selectedModelIds_draft.includes(modelId)
                )
            ) {
                return true;
            }

            // A successful test lists models we didn't have: saving makes them usable
            if (
                state.connectionTest.stateDescription === "succeeded" &&
                aiProvider_current.models.stateDescription !== "loaded"
            ) {
                return true;
            }

            return (
                formValues.name.trim() !== aiProvider_current.name || !isConnectionSaved
            );
        })();

        /** The same as on the card, but for what is on screen, saved or not */
        const connectionState = getProviderConnectionState({
            connection: state.connectionTest.stateDescription
        });

        const canTestConnection =
            formValues.providerType !== undefined &&
            isApiBaseValid &&
            !state.isSubmitting &&
            state.connectionTest.stateDescription !== "testing";

        return {
            isOpen: true as const,
            providerName_current,
            providerOrigin,
            isEditing: providerName_current !== undefined,
            canEditApiKey,
            formValues,
            connectionTest: state.connectionTest,
            selectedModelIds_draft,
            isSubmitting: state.isSubmitting,
            hasSubmissionFailed: state.hasSubmissionFailed,
            isNameValid,
            isApiBaseValid,
            canTestConnection,
            hasChanges,
            connectionState,
            availableModels,
            isModelSelectionSavedImmediately,
            canSubmit:
                hasChanges &&
                isNameValid &&
                formValues.providerType !== undefined &&
                isApiBaseValid &&
                !state.isSubmitting &&
                state.connectionTest.stateDescription !== "testing",
            supportedProviderTypes: supportedAiProviderTypes
        };
    }
);

export const selectors = { main };
