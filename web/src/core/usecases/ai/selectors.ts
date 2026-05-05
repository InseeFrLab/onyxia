import { createSelector } from "clean-architecture";
import type { State as RootState } from "core/bootstrap";
import { name } from "./state";
import * as deploymentRegionManagement from "core/usecases/deploymentRegionManagement";
import { assert } from "tsafe";

const state = (rootState: RootState) => rootState[name];

const main = createSelector(
    state,
    deploymentRegionManagement.selectors.currentDeploymentRegion,
    (state, region) => {
        if (!state.isEnabled) {
            const { initializationStatus } = state;

            if (initializationStatus === "no-account") {
                assert(
                    region.ai !== undefined,
                    "region.ai should exists in case of no-account status"
                );

                return {
                    isEnabled: false as const,
                    initializationStatus,
                    webUiUrl: region.ai.url
                };
            }

            return { isEnabled: false as const, initializationStatus };
        }

        const {
            webUiUrl,
            apiBase,
            token,
            availableModels,
            selectedModel,
            customProviders
        } = state;

        return {
            isEnabled: true as const,
            webUiUrl,
            apiBase,
            token,
            availableModels,
            selectedModel,
            customProviders
        };
    }
);

export const selectors = { main };
