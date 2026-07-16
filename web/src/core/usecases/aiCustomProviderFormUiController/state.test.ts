import { describe, expect, it } from "vitest";
import { actions, reducer, type State } from "./state";

function createOpenedState(params?: {
    isAlreadyDefault?: boolean;
    selectedModelId?: string;
    connectionTest?: State.ConnectionTest;
}) {
    return reducer(
        undefined,
        actions.opened({
            editedProviderId: undefined,
            isAlreadyDefault: params?.isAlreadyDefault ?? false,
            formValues: {
                name: "My provider",
                provider: "openai",
                apiBase: "https://api.openai.com/v1",
                apiKey: "secret",
                selectedModelId: params?.selectedModelId ?? "model-1"
            },
            connectionTest: params?.connectionTest ?? {
                stateDescription: "success",
                models: [{ id: "model-1", name: "Model 1" }]
            },
            connectionTestRequestId: undefined,
            doSetAsDefault: params?.isAlreadyDefault ?? false,
            isSubmitting: false,
            submissionRequestId: undefined
        })
    );
}

describe("aiCustomProviderFormUiController state", () => {
    it("invalidates the connection test when credentials change", () => {
        const state = reducer(
            createOpenedState(),
            actions.formValueChanged({ key: "apiKey", value: "new-secret" })
        );

        expect(state).toMatchObject({
            stateDescription: "opened",
            formValues: {
                apiKey: "new-secret",
                selectedModelId: ""
            },
            connectionTest: { stateDescription: "idle" }
        });
    });

    it("ignores a stale connection-test result", () => {
        const state = reducer(
            reducer(
                createOpenedState({
                    selectedModelId: "",
                    connectionTest: { stateDescription: "idle" }
                }),
                actions.connectionTestStarted({ requestId: "current-request" })
            ),
            actions.connectionTestSucceeded({
                requestId: "stale-request",
                models: [{ id: "model-2", name: "Model 2" }]
            })
        );

        expect(state).toMatchObject({
            stateDescription: "opened",
            connectionTest: { stateDescription: "testing" },
            connectionTestRequestId: "current-request"
        });
    });

    it("does not allow an already-default provider to be unset", () => {
        const state = reducer(
            createOpenedState({ isAlreadyDefault: true }),
            actions.doSetAsDefaultChanged({ doSetAsDefault: false })
        );

        expect(state).toMatchObject({
            stateDescription: "opened",
            doSetAsDefault: true
        });
    });

    it("closes only after the current submission succeeds", () => {
        const submittingState = reducer(
            createOpenedState(),
            actions.submissionStarted({ requestId: "current-request" })
        );

        const afterStaleSuccess = reducer(
            submittingState,
            actions.submissionSucceeded({ requestId: "stale-request" })
        );

        expect(afterStaleSuccess).toMatchObject({
            stateDescription: "opened",
            isSubmitting: true
        });

        expect(
            reducer(
                afterStaleSuccess,
                actions.submissionSucceeded({ requestId: "current-request" })
            )
        ).toEqual({ stateDescription: "closed" });
    });
});
