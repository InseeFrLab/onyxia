import { createSelector } from "clean-architecture";
import type { State as RootState } from "core/bootstrap";
import { getRootContext } from "core/rootContext";
import * as userConfigs from "core/usecases/userConfigs";
import { name } from "./state";
import {
    createAiProviders,
    createAiProvidersWithRuntime,
    getDefaultModel,
    type AiProvider,
    type AiProviderWithRuntime
} from "./decoupledLogic/aiProviders";
import {
    createEmptyPersistedAiConfig,
    parseAiConfigStr
} from "./decoupledLogic/persistedAiConfig";
import { createAiContext, emptyAiContext } from "./decoupledLogic/aiContext";

const state = (rootState: RootState) => rootState[name];

const stateDescription = createSelector(state, state => state.stateDescription);

/** undefined unless the use case failed to load. */
const errorReason = createSelector(state, state =>
    state.stateDescription === "error" ? state.reason : undefined
);

/**
 * Unsaved edits take precedence over userConfigs, including while userConfigs performs
 * its own optimistic update or rolls back a failed write.
 */
const persistedAiConfig = createSelector(
    (rootState: RootState) => {
        const { oidc } = getRootContext();

        if (!oidc.isUserLoggedIn) {
            return undefined;
        }

        return userConfigs.selectors.userConfigs(rootState).aiConfigStr;
    },
    state,
    (aiConfigStr, state) =>
        (state.stateDescription === "ready" ? state.unsavedConfig : undefined) ??
        (aiConfigStr === undefined ? undefined : parseAiConfigStr({ aiConfigStr })) ??
        createEmptyPersistedAiConfig()
);

/** undefined until the use case has been loaded. */
const aiProviders_withoutRuntime = createSelector(
    persistedAiConfig,
    stateDescription,
    (persistedAiConfig, stateDescription): AiProvider[] | undefined =>
        stateDescription !== "ready"
            ? undefined
            : createAiProviders({
                  aiConfig: getRootContext().aiConfig,
                  persistedAiConfig
              })
);

const aiProviderRuntimes = createSelector(state, state =>
    state.stateDescription === "ready" ? state.runtimeByProviderName : undefined
);

/** Providers enriched at read time with their volatile runtime state. */
const aiProviders = createSelector(
    aiProviders_withoutRuntime,
    aiProviderRuntimes,
    persistedAiConfig,
    (
        aiProviders,
        runtimeByProviderName,
        persistedAiConfig
    ): AiProviderWithRuntime[] | undefined =>
        aiProviders === undefined || runtimeByProviderName === undefined
            ? undefined
            : createAiProvidersWithRuntime({
                  aiProviders,
                  runtimeByProviderName,
                  persistedAiConfig
              })
);

/**
 * The model the user elected among everything they ticked, undefined when they elected
 * none or when what they had elected is no longer selected.
 */
const defaultModel = createSelector(
    aiProviders,
    persistedAiConfig,
    (aiProviders, persistedAiConfig) =>
        aiProviders === undefined
            ? undefined
            : getDefaultModel({
                  aiProviders,
                  defaultModel_persisted: persistedAiConfig.defaultModel
              })
);

const aiContext = createSelector(
    aiProviders,
    defaultModel,
    (aiProviders, defaultModel) =>
        aiProviders === undefined
            ? emptyAiContext
            : createAiContext({ aiProviders, defaultModel })
);

export const selectors = {
    stateDescription,
    errorReason,
    configSaveState: createSelector(state, state =>
        state.stateDescription === "ready" ? state.configSaveState : "idle"
    ),
    aiProviders,
    defaultModel
};

export const protectedSelectors = {
    aiContext,
    persistedAiConfig
};
