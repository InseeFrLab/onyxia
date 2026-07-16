import type { Thunks } from "core/bootstrap";
import * as ai from "core/usecases/ai";
import { assert } from "tsafe/assert";
import {
    isCustomProviderProtocol,
    resolveApiBaseOnProviderChange
} from "./decoupledLogic/resolveApiBaseOnProviderChange";
import { privateSelectors } from "./selectors";
import { actions, type ChangeValueParams } from "./state";

function createEmptyFormValues() {
    return {
        name: "",
        provider: "",
        apiBase: "",
        apiKey: "",
        selectedModelId: ""
    };
}

export const thunks = {
    open:
        (params: { providerId: string | undefined }) =>
        (...args) => {
            const { providerId } = params;
            const [dispatch, getState] = args;

            if (providerId === undefined) {
                dispatch(
                    actions.opened({
                        editedProviderId: undefined,
                        isAlreadyDefault: false,
                        formValues: createEmptyFormValues(),
                        connectionTest: { stateDescription: "idle" },
                        connectionTestRequestId: undefined,
                        doSetAsDefault: false,
                        isSubmitting: false,
                        submissionRequestId: undefined
                    })
                );
                return;
            }

            const aiState = ai.selectors.main(getState());
            assert(aiState.stateDescription === "initialized");

            const provider = aiState.customProviders.find(
                provider => provider.id === providerId
            );
            assert(provider !== undefined);

            const models =
                provider.models?.stateDescription === "loaded"
                    ? provider.models.availableModels
                    : undefined;

            const selectedModelId =
                models?.some(model => model.id === provider.selectedModelId) === true
                    ? provider.selectedModelId
                    : undefined;

            dispatch(
                actions.opened({
                    editedProviderId: provider.id,
                    isAlreadyDefault: provider.isDefault,
                    formValues: {
                        name: provider.name,
                        provider: provider.provider,
                        apiBase: provider.apiBase,
                        apiKey: provider.apiKey,
                        selectedModelId: selectedModelId ?? ""
                    },
                    connectionTest:
                        models === undefined
                            ? { stateDescription: "idle" }
                            : { stateDescription: "success", models },
                    connectionTestRequestId: undefined,
                    doSetAsDefault: provider.isDefault,
                    isSubmitting: false,
                    submissionRequestId: undefined
                })
            );
        },
    close:
        () =>
        (...args) => {
            const [dispatch] = args;
            dispatch(actions.closed());
        },
    changeValue:
        (params: ChangeValueParams) =>
        (...args) => {
            const [dispatch] = args;
            dispatch(actions.formValueChanged(params));
        },
    changeProvider:
        (params: { provider: string }) =>
        (...args) => {
            const { provider } = params;
            const [dispatch, getState] = args;

            assert(isCustomProviderProtocol(provider));

            const state = privateSelectors.state(getState());
            assert(state.stateDescription === "opened");

            dispatch(
                actions.providerChanged({
                    provider,
                    apiBase: resolveApiBaseOnProviderChange({
                        currentApiBase: state.formValues.apiBase,
                        nextProvider: provider
                    })
                })
            );
        },
    changeDoSetAsDefault:
        (params: { doSetAsDefault: boolean }) =>
        (...args) => {
            const [dispatch] = args;
            dispatch(actions.doSetAsDefaultChanged(params));
        },
    testConnection:
        () =>
        async (...args) => {
            const [dispatch, getState] = args;

            const state = privateSelectors.state(getState());
            assert(state.stateDescription === "opened");

            if (
                !privateSelectors.canTestConnection(getState()) ||
                state.connectionTest.stateDescription === "testing"
            ) {
                return;
            }

            const requestId = crypto.randomUUID();
            const { provider, apiBase, apiKey } = state.formValues;

            dispatch(actions.connectionTestStarted({ requestId }));

            try {
                const { models } = await dispatch(
                    ai.thunks.testCustomProviderConnection({
                        provider,
                        apiBase,
                        apiKey
                    })
                );

                dispatch(actions.connectionTestSucceeded({ requestId, models }));
            } catch {
                dispatch(actions.connectionTestFailed({ requestId }));
            }
        },
    submit:
        () =>
        async (...args) => {
            const [dispatch, getState] = args;

            const form = privateSelectors.submittableForm(getState());

            if (form === undefined) {
                return;
            }

            const requestId = crypto.randomUUID();
            dispatch(actions.submissionStarted({ requestId }));

            const {
                editedProviderId,
                name,
                provider,
                apiBase,
                apiKey,
                models,
                selectedModelId,
                doSetAsDefault
            } = form;

            try {
                if (editedProviderId === undefined) {
                    await dispatch(
                        ai.thunks.addCustomProvider({
                            name,
                            provider,
                            apiBase,
                            apiKey,
                            models,
                            selectedModelId,
                            doSetAsDefault
                        })
                    );
                } else {
                    await dispatch(
                        ai.thunks.editCustomProvider({
                            providerId: editedProviderId,
                            name,
                            provider,
                            apiBase,
                            apiKey,
                            models,
                            selectedModelId,
                            doSetAsDefault
                        })
                    );
                }

                dispatch(actions.submissionSucceeded({ requestId }));
            } catch {
                dispatch(actions.submissionFailed({ requestId }));
            }
        }
} satisfies Thunks;
