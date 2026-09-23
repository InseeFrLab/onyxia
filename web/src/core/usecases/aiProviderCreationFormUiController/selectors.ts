import { createSelector } from "clean-architecture";
import type { State as RootState } from "core/bootstrap";
import * as aiProvidersManagements from "core/usecases/aiProvidersManagements";
import { supportedAiProviderTypes } from "core/usecases/aiProvidersManagements/decoupledLogic/supportedAiProviderTypes";
import { name } from "./state";

const state = (rootState: RootState) => rootState[name];

const main = createSelector(
    state,
    aiProvidersManagements.selectors.aiProviders,
    (state, aiProviders) => {
        if (state.stateDescription === "closed") {
            return { isOpen: false as const };
        }

        const { formValues, providerName_current } = state;

        const providerName = formValues.name.trim();

        const isNameValid =
            providerName !== "" &&
            !providerName.includes("/") &&
            // The name is the provider's id, it has to stay unique.
            !(aiProviders ?? []).some(
                aiProvider =>
                    aiProvider.name === providerName &&
                    aiProvider.name !== providerName_current
            );

        const isApiBaseValid = (() => {
            let url: URL;

            try {
                url = new URL(formValues.apiBase.trim());
            } catch {
                return false;
            }

            return url.protocol === "http:" || url.protocol === "https:";
        })();

        const canTestConnection =
            formValues.providerType !== undefined &&
            isApiBaseValid &&
            !state.isSubmitting &&
            state.connectionTest.stateDescription !== "testing";

        return {
            isOpen: true as const,
            providerName_current,
            isEditing: providerName_current !== undefined,
            formValues,
            connectionTest: state.connectionTest,
            selectedModelIds_draft: state.selectedModelIds_draft,
            isSubmitting: state.isSubmitting,
            hasSubmissionFailed: state.hasSubmissionFailed,
            isNameValid,
            isApiBaseValid,
            canTestConnection,
            canSubmit:
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
