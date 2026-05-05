import { createUsecaseActions } from "clean-architecture";
import { id } from "tsafe/id";

export const name = "ai";

export type CustomAiProvider = {
    id: string;
    label: string;
    apiBase: string;
    apiKey: string;
    availableModels: string[];
    selectedModel: string | undefined;
    modelsFetchStatus: "fetching" | "success" | "error";
};

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
        customProviders: CustomAiProvider[];
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
                    customProviders: CustomAiProvider[];
                };
            }
        ) => {
            const {
                webUiUrl,
                apiBase,
                token,
                availableModels,
                selectedModel,
                customProviders
            } = payload;

            return id<State.Enabled>({
                isEnabled: true,
                webUiUrl,
                apiBase,
                token,
                availableModels,
                selectedModel: selectedModel ?? availableModels[0],
                customProviders
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
        },
        customProviderAdded: (state, { payload }: { payload: CustomAiProvider }) => {
            if (!state.isEnabled) return;
            state.customProviders.push(payload);
        },
        customProviderDeleted: (state, { payload }: { payload: { id: string } }) => {
            if (!state.isEnabled) return;
            const i = state.customProviders.findIndex(p => p.id === payload.id);
            if (i !== -1) state.customProviders.splice(i, 1);
        },
        customProviderModelsLoaded: (
            state,
            { payload }: { payload: { id: string; models: string[] } }
        ) => {
            if (!state.isEnabled) return;
            const provider = state.customProviders.find(p => p.id === payload.id);
            if (provider === undefined) return;
            provider.availableModels = payload.models;
            provider.modelsFetchStatus = "success";
            if (provider.selectedModel === undefined && payload.models.length > 0) {
                provider.selectedModel = payload.models[0];
            }
        },
        customProviderModelsFetchFailed: (
            state,
            { payload }: { payload: { id: string } }
        ) => {
            if (!state.isEnabled) return;
            const provider = state.customProviders.find(p => p.id === payload.id);
            if (provider === undefined) return;
            provider.modelsFetchStatus = "error";
        },
        customProviderSelectedModelSet: (
            state,
            { payload }: { payload: { id: string; model: string } }
        ) => {
            if (!state.isEnabled) return;
            const provider = state.customProviders.find(p => p.id === payload.id);
            if (provider === undefined) return;
            provider.selectedModel = payload.model;
        }
    }
});
