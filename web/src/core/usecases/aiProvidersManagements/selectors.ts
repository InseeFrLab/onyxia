import { createSelector } from "clean-architecture";
import type { State as RootState } from "core/bootstrap";
import { getRootContext } from "core/rootContext";
import * as userConfigs from "core/usecases/userConfigs";
import { name } from "./state";
import {
    createAiProviders,
    getDefaultModel,
    type AiProvider
} from "./decoupledLogic/aiProviders";
import {
    createEmptyPersistedAiConfig,
    parseAiConfigStr
} from "./decoupledLogic/persistedAiConfig";
import { createAiContext, emptyAiContext } from "./decoupledLogic/aiContext";

const state = (rootState: RootState) => rootState[name];

const stateDescription = createSelector(state, state => state.stateDescription);

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
const aiProviders = createSelector(
    persistedAiConfig,
    createSelector(state, state =>
        state.stateDescription !== "ready" ? undefined : state.runtimeByProviderName
    ),
    (persistedAiConfig, runtimeByProviderName): AiProvider[] | undefined =>
        runtimeByProviderName === undefined
            ? undefined
            : createAiProviders({
                  aiConfig: getRootContext().aiConfig,
                  persistedAiConfig,
                  runtimeByProviderName
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
