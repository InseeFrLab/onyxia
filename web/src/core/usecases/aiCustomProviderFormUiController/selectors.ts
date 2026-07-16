import { createSelector } from "clean-architecture";
import type { State as RootState } from "core/bootstrap";
import { customProviderProtocols } from "./decoupledLogic/resolveApiBaseOnProviderChange";
import { name } from "./state";

const state = (rootState: RootState) => rootState[name];

const isFormSubmittable = createSelector(state, state => {
    if (state.stateDescription !== "opened" || state.isSubmitting) {
        return false;
    }

    const { formValues, connectionTest } = state;

    return (
        formValues.name.trim() !== "" &&
        formValues.provider !== "" &&
        formValues.apiBase.trim() !== "" &&
        formValues.apiKey.trim() !== "" &&
        formValues.selectedModelId !== "" &&
        connectionTest.stateDescription === "success" &&
        connectionTest.models.some(model => model.id === formValues.selectedModelId)
    );
});

const canTestConnection = createSelector(state, state => {
    if (state.stateDescription !== "opened" || state.isSubmitting) {
        return false;
    }

    return (
        state.formValues.provider !== "" &&
        state.formValues.apiBase.trim() !== "" &&
        state.formValues.apiKey.trim() !== ""
    );
});

const submittableForm = createSelector(state, isFormSubmittable, (state, isValid) => {
    if (state.stateDescription !== "opened" || !isValid) {
        return undefined;
    }

    if (state.connectionTest.stateDescription !== "success") {
        return undefined;
    }

    return {
        editedProviderId: state.editedProviderId,
        name: state.formValues.name.trim(),
        provider: state.formValues.provider,
        apiBase: state.formValues.apiBase.trim(),
        apiKey: state.formValues.apiKey.trim(),
        models: state.connectionTest.models,
        selectedModelId: state.formValues.selectedModelId,
        doSetAsDefault: state.doSetAsDefault
    };
});

const main = createSelector(
    state,
    isFormSubmittable,
    canTestConnection,
    (state, canSubmit, canTest) => {
        if (state.stateDescription === "closed") {
            return { isOpen: false as const };
        }

        return {
            isOpen: true as const,
            isEditing: state.editedProviderId !== undefined,
            isAlreadyDefault: state.isAlreadyDefault,
            formValues: state.formValues,
            connectionTest: state.connectionTest,
            testedModels:
                state.connectionTest.stateDescription === "success"
                    ? state.connectionTest.models
                    : undefined,
            doSetAsDefault: state.doSetAsDefault,
            isSubmitting: state.isSubmitting,
            canSubmit,
            canTest,
            supportedProtocols: customProviderProtocols
        };
    }
);

export const privateSelectors = { state, canTestConnection, submittableForm };

export const selectors = { main };
