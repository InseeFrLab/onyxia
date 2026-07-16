import { createUsecaseActions } from "clean-architecture";
import { assert } from "tsafe/assert";
import { id } from "tsafe/id";

export type State = State.Closed | State.Opened;

export namespace State {
    export type Closed = { stateDescription: "closed" };

    export type Opened = {
        stateDescription: "opened";
        editedProviderId: string | undefined;
        isAlreadyDefault: boolean;
        formValues: FormValues;
        connectionTest: ConnectionTest;
        connectionTestRequestId: string | undefined;
        doSetAsDefault: boolean;
        isSubmitting: boolean;
        submissionRequestId: string | undefined;
    };

    export type FormValues = {
        name: string;
        provider: string;
        apiBase: string;
        apiKey: string;
        selectedModelId: string;
    };

    export type AiModel = { id: string; name: string };

    export type ConnectionTest =
        | { stateDescription: "idle" }
        | { stateDescription: "testing" }
        | { stateDescription: "success"; models: AiModel[] }
        | { stateDescription: "error" };
}

export type ChangeValueParams = {
    key: keyof State.FormValues;
    value: string;
};

export const name = "aiCustomProviderFormUiController";

export const { reducer, actions } = createUsecaseActions({
    name,
    initialState: id<State>({ stateDescription: "closed" }),
    reducers: {
        opened: (_, { payload }: { payload: Omit<State.Opened, "stateDescription"> }) =>
            id<State.Opened>({ stateDescription: "opened", ...payload }),
        closed: () => id<State.Closed>({ stateDescription: "closed" }),
        formValueChanged: (state, { payload }: { payload: ChangeValueParams }) => {
            assert(state.stateDescription === "opened");

            state.formValues[payload.key] = payload.value;

            if (payload.key !== "apiBase" && payload.key !== "apiKey") {
                return;
            }

            state.formValues.selectedModelId = "";
            state.connectionTest = { stateDescription: "idle" };
            state.connectionTestRequestId = undefined;
        },
        providerChanged: (
            state,
            { payload }: { payload: { provider: string; apiBase: string } }
        ) => {
            assert(state.stateDescription === "opened");

            state.formValues.provider = payload.provider;
            state.formValues.apiBase = payload.apiBase;
            state.formValues.selectedModelId = "";
            state.connectionTest = { stateDescription: "idle" };
            state.connectionTestRequestId = undefined;
        },
        doSetAsDefaultChanged: (
            state,
            { payload }: { payload: { doSetAsDefault: boolean } }
        ) => {
            assert(state.stateDescription === "opened");

            if (state.isAlreadyDefault) {
                return;
            }

            state.doSetAsDefault = payload.doSetAsDefault;
        },
        connectionTestStarted: (
            state,
            { payload }: { payload: { requestId: string } }
        ) => {
            assert(state.stateDescription === "opened");
            state.connectionTest = { stateDescription: "testing" };
            state.connectionTestRequestId = payload.requestId;
        },
        connectionTestSucceeded: (
            state,
            {
                payload
            }: {
                payload: { requestId: string; models: State.AiModel[] };
            }
        ) => {
            if (
                state.stateDescription !== "opened" ||
                state.connectionTestRequestId !== payload.requestId
            ) {
                return;
            }

            if (
                !payload.models.some(
                    model => model.id === state.formValues.selectedModelId
                )
            ) {
                state.formValues.selectedModelId = "";
            }

            state.connectionTest = {
                stateDescription: "success",
                models: payload.models
            };
            state.connectionTestRequestId = undefined;
        },
        connectionTestFailed: (
            state,
            { payload }: { payload: { requestId: string } }
        ) => {
            if (
                state.stateDescription !== "opened" ||
                state.connectionTestRequestId !== payload.requestId
            ) {
                return;
            }

            state.formValues.selectedModelId = "";
            state.connectionTest = { stateDescription: "error" };
            state.connectionTestRequestId = undefined;
        },
        submissionStarted: (state, { payload }: { payload: { requestId: string } }) => {
            assert(state.stateDescription === "opened");
            state.isSubmitting = true;
            state.submissionRequestId = payload.requestId;
        },
        submissionFailed: (state, { payload }: { payload: { requestId: string } }) => {
            if (
                state.stateDescription !== "opened" ||
                state.submissionRequestId !== payload.requestId
            ) {
                return;
            }

            state.isSubmitting = false;
            state.submissionRequestId = undefined;
        },
        submissionSucceeded: (state, { payload }: { payload: { requestId: string } }) => {
            if (
                state.stateDescription !== "opened" ||
                state.submissionRequestId !== payload.requestId
            ) {
                return;
            }

            return id<State.Closed>({ stateDescription: "closed" });
        }
    }
});
