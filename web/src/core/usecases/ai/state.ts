import { createUsecaseActions } from "clean-architecture";
import { id } from "tsafe/id";

export const name = "ai";

type State = State.Disabled | State.Enabled;

export declare namespace State {
    export type Disabled = {
        isEnabled: false;
        initializationStatus: "not-started" | "pending" | "error" | "no-account";
    };

    export type Enabled = {
        isEnabled: true;
        webUiUrl: string;
        apiBase: string;
        token: string | undefined;
        availableModels: string[];
        selectedModel: string | undefined;
    };
}

export const { reducer, actions } = createUsecaseActions({
    name,
    initialState: id<State>(
        id<State.Disabled>({ isEnabled: false, initializationStatus: "not-started" })
    ),
    reducers: {
        initializeStart: state => {
            if (state.isEnabled) return;
            state.initializationStatus = "pending";
        },
        initializeFailed: (
            _,
            { payload }: { payload: { cause: "error" | "no-account" } }
        ) =>
            id<State.Disabled>({
                isEnabled: false,
                initializationStatus: payload.cause
            }),
        initializeSucceed: (
            _,
            {
                payload
            }: {
                payload: {
                    webUiUrl: string;
                    apiBase: string;
                    token: string;
                    availableModels: string[];
                    selectedModel: string | undefined;
                };
            }
        ) => {
            const { webUiUrl, apiBase, token, availableModels, selectedModel } = payload;

            return id<State.Enabled>({
                isEnabled: true,
                webUiUrl,
                apiBase,
                token,
                availableModels,
                selectedModel: selectedModel ?? availableModels[0]
            });
        },
        tokenRefreshed: (state, { payload }: { payload: { token: string } }) => {
            if (!state.isEnabled) return;
            state.token = payload.token;
        },
        tokenRefreshFailed: state => {
            if (!state.isEnabled) return;
            state.token = undefined;
        },
        selectedModelSet: (state, { payload }: { payload: { model: string } }) => {
            if (!state.isEnabled) return;
            state.selectedModel = payload.model;
        }
    }
});
