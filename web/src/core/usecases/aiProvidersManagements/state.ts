import { createUsecaseActions } from "clean-architecture";
import { id } from "tsafe/id";
import { assert } from "tsafe/assert";
import type { AiModel } from "core/tools/fetchAiModels";
import {
    createInitialProviderRuntime,
    type AiProvider,
    type ProviderRuntime
} from "./decoupledLogic/aiProviders";
import type { AiInitializationError } from "./evt";
import type { PersistedAiConfig } from "./decoupledLogic/persistedAiConfig";

export const name = "aiProvidersManagements";

/** Providers are derived from configuration and runtime data. Unsaved edits stay in
 * memory until the background writer has persisted the latest configuration. */
export type State = State.NotLoaded | State.Loading | State.Error | State.Ready;

export declare namespace State {
    export type NotLoaded = { stateDescription: "not loaded" };

    export type Loading = { stateDescription: "loading" };

    /** The user's persisted config could not be read back, nothing can be shown. */
    export type Error = { stateDescription: "error" };

    export type Ready = {
        stateDescription: "ready";
        /** Keyed by provider name, absent until a provider has been talked to. */
        runtimeByProviderName: Record<string, ProviderRuntime>;
        unsavedConfig: PersistedAiConfig | undefined;
        configSaveState: "idle" | "pending" | "error";
    };
}

export const { reducer, actions } = createUsecaseActions({
    name,
    initialState: id<State>(id<State.NotLoaded>({ stateDescription: "not loaded" })),
    reducers: {
        configChanged: (state, { payload }: { payload: PersistedAiConfig }) => {
            assert(state.stateDescription === "ready");
            state.unsavedConfig = payload;
            state.configSaveState = "pending";
        },
        configSaveStarted: state => {
            assert(state.stateDescription === "ready");
            state.configSaveState = "pending";
        },
        configSaved: (state, { payload }: { payload: PersistedAiConfig }) => {
            assert(state.stateDescription === "ready");
            if (JSON.stringify(state.unsavedConfig) !== JSON.stringify(payload)) return;
            state.unsavedConfig = undefined;
            state.configSaveState = "idle";
        },
        configSaveFailed: state => {
            assert(state.stateDescription === "ready");
            state.configSaveState = "error";
        },
        loadingStarted: () => id<State.Loading>({ stateDescription: "loading" }),
        loadingFailed: () => id<State.Error>({ stateDescription: "error" }),
        loaded: () =>
            id<State.Ready>({
                stateDescription: "ready",
                runtimeByProviderName: {},
                unsavedConfig: undefined,
                configSaveState: "idle"
            }),
        /**
         * Emitted for the sole purpose of letting the UI display it, see evt.ts. The
         * state itself carries the error of each provider.
         */
        errorNotified: (_state, _action: { payload: AiInitializationError }) => {},
        providerAuthChanged: (
            state,
            {
                payload
            }: { payload: { providerName: string; auth: ProviderRuntime["auth"] } }
        ) => {
            const { providerName, auth } = payload;

            assert(state.stateDescription === "ready");

            getOrCreateRuntime({ state, providerName }).auth = auth;
        },
        providerModelsChanged: (
            state,
            { payload }: { payload: { providerName: string; models: AiProvider.Models } }
        ) => {
            const { providerName, models } = payload;

            assert(state.stateDescription === "ready");

            getOrCreateRuntime({ state, providerName }).models = models;
        },
        /**
         * The creation form only submits a provider it has successfully talked to, so we
         * already know its models and don't have to fetch them again.
         */
        userProviderCreated: (
            state,
            { payload }: { payload: { providerName: string; availableModels: AiModel[] } }
        ) => {
            const { providerName, availableModels } = payload;

            assert(state.stateDescription === "ready");

            state.runtimeByProviderName[providerName] = {
                auth: { stateDescription: "not loaded" },
                models: { stateDescription: "loaded", availableModels }
            };
        },
        userProviderDeleted: (
            state,
            { payload }: { payload: { providerName: string } }
        ) => {
            const { providerName } = payload;

            assert(state.stateDescription === "ready");

            delete state.runtimeByProviderName[providerName];
        }
    }
});

function getOrCreateRuntime(params: {
    state: State.Ready;
    providerName: string;
}): ProviderRuntime {
    const { state, providerName } = params;

    return (state.runtimeByProviderName[providerName] ??= createInitialProviderRuntime());
}
