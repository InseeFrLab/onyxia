import type { Thunks } from "core/bootstrap";
import { actions } from "./state";
import { getLocalStorage } from "core/tools/safeLocalStorage";
import * as deploymentRegionManagement from "core/usecases/deploymentRegionManagement";
import { assert } from "tsafe";

const SELECTED_MODEL_STORAGE_KEY = "onyxia:ai:selectedModel";

export const thunks = {
    isAvailable:
        () =>
        (...args): boolean => {
            const [, getState] = args;
            const region =
                deploymentRegionManagement.selectors.currentDeploymentRegion(getState());
            return region.ai !== undefined;
        },
    refreshToken:
        () =>
        async (...args) => {
            const [dispatch, , { ai }] = args;

            assert(ai !== undefined);

            const result = await ai.getToken();

            if (result.status !== "success") {
                dispatch(actions.tokenRefreshFailed());
                return;
            }

            dispatch(actions.tokenRefreshed({ token: result.token }));
        },
    setSelectedModel:
        (params: { model: string }) =>
        (...args) => {
            const { model } = params;
            const [dispatch] = args;

            const { localStorage } = getLocalStorage();

            localStorage.setItem(SELECTED_MODEL_STORAGE_KEY, model);

            dispatch(actions.selectedModelSet({ model }));
        }
} satisfies Thunks;

export const protectedThunks = {
    initialize:
        () =>
        async (...args) => {
            const [dispatch, , { ai }] = args;

            if (ai === undefined) {
                return;
            }

            const { localStorage } = getLocalStorage();

            dispatch(actions.initializeStart());

            const tokenResult = await ai.getToken();

            if (tokenResult.status !== "success") {
                dispatch(actions.initializeFailed({ cause: tokenResult.status }));
                return;
            }

            const { token } = tokenResult;
            const availableModels = await ai.listModels(token);

            dispatch(
                actions.initializeSucceed({
                    webUiUrl: ai.webUiUrl,
                    apiBase: ai.apiBase,
                    token,
                    availableModels,
                    selectedModel:
                        localStorage.getItem(SELECTED_MODEL_STORAGE_KEY) ?? undefined
                })
            );
        }
} satisfies Thunks;
