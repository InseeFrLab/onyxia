import { createUsecaseActions } from "clean-architecture";
import { id } from "tsafe/id";
import { assert } from "tsafe/assert";
import type { AiConfig } from "core/ports/OnyxiaApi/AiConfig";
import type { AiModel } from "core/tools/fetchAiModels";

export const name = "aiProviderCreationFormUiController";

export type State = State.Closed | State.Open;

export declare namespace State {
    export type Closed = { stateDescription: "closed" };

    export type Open = {
        stateDescription: "open";
        /** The provider being edited, undefined when one is being created. */
        providerName_current: string | undefined;
        formValues: FormValues;
        connectionTest: ConnectionTest;
        /** The models the user ticked before saving */
        selectedModelIds_draft: string[];
        isSubmitting: boolean;
        hasSubmissionFailed: boolean;
    };

    export type FormValues = {
        name: string;
        providerType: AiConfig.SupportedAiProviderType | undefined;
        apiBase: string;
        apiKey: string;
    };

    export type ConnectionTest =
        | { stateDescription: "not tested" }
        | { stateDescription: "testing" }
        | { stateDescription: "failed" }
        | { stateDescription: "succeeded"; availableModels: AiModel[] };
}

export type ChangeValueParams<K extends keyof State.FormValues = keyof State.FormValues> =
    {
        key: K;
        value: State.FormValues[K];
    };

export const { reducer, actions } = createUsecaseActions({
    name,
    initialState: id<State>(id<State.Closed>({ stateDescription: "closed" })),
    reducers: {
        opened: (
            _state,
            {
                payload
            }: {
                payload: {
                    providerName_current: string | undefined;
                    formValues: State.FormValues;
                    connectionTest: State.ConnectionTest;
                    selectedModelIds_draft: string[];
                };
            }
        ) => {
            const {
                providerName_current,
                formValues,
                connectionTest,
                selectedModelIds_draft
            } = payload;

            return id<State.Open>({
                stateDescription: "open",
                providerName_current,
                formValues,
                connectionTest,
                selectedModelIds_draft,
                isSubmitting: false,
                hasSubmissionFailed: false
            });
        },
        closed: () => id<State.Closed>({ stateDescription: "closed" }),
        formValueChanged: (state, { payload }: { payload: ChangeValueParams }) => {
            const { key, value } = payload;

            assert(state.stateDescription === "open");

            if (state.formValues[key] === value) {
                return;
            }

            Object.assign(state.formValues, { [key]: value });

            state.hasSubmissionFailed = false;

            if (key === "name") {
                //the name do not change the connection test result
                return;
            }

            state.connectionTest = { stateDescription: "not tested" };
        },
        connectionTestStarted: state => {
            assert(state.stateDescription === "open");

            state.connectionTest = { stateDescription: "testing" };
        },
        connectionTestSucceeded: (
            state,
            { payload }: { payload: { availableModels: AiModel[] } }
        ) => {
            const { availableModels } = payload;

            assert(state.stateDescription === "open");

            state.connectionTest = { stateDescription: "succeeded", availableModels };

            // Keep the selection made before a new test, as long as the models still exist
            state.selectedModelIds_draft = state.selectedModelIds_draft.filter(modelId =>
                availableModels.some(availableModel => availableModel.id === modelId)
            );
        },
        selectedModelIdsChanged: (
            state,
            { payload }: { payload: { selectedModelIds: string[] } }
        ) => {
            const { selectedModelIds } = payload;

            assert(state.stateDescription === "open");

            state.selectedModelIds_draft = selectedModelIds;
        },
        connectionTestFailed: state => {
            assert(state.stateDescription === "open");

            state.connectionTest = { stateDescription: "failed" };
        },
        submissionStarted: state => {
            assert(state.stateDescription === "open");

            state.isSubmitting = true;
            state.hasSubmissionFailed = false;
        },
        submissionFailed: state => {
            assert(state.stateDescription === "open");

            state.isSubmitting = false;
            state.hasSubmissionFailed = true;
        },
        submissionSucceeded: () => id<State.Closed>({ stateDescription: "closed" })
    }
});
