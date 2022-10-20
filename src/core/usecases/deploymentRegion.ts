import { assert } from "tsafe/assert";
import type { ThunkAction } from "../setup";
import type { DeploymentRegion } from "../ports/OnyxiaApiClient";
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import {
    createObjectThatThrowsIfAccessedFactory,
    isPropertyAccessedByReduxOrStorybook,
} from "../tools/createObjectThatThrowsIfAccessed";
import type { RootState } from "../setup";

type DeploymentRegionState = {
    availableDeploymentRegions: DeploymentRegion[];
    selectedDeploymentRegionId: string;
};

const { createObjectThatThrowsIfAccessed } = createObjectThatThrowsIfAccessedFactory({
    "isPropertyWhitelisted": isPropertyAccessedByReduxOrStorybook,
});

export const name = "deploymentRegion";

export const { reducer, actions } = createSlice({
    name,
    "initialState": createObjectThatThrowsIfAccessed<DeploymentRegionState>(),
    "reducers": {
        "initialize": (_, { payload }: PayloadAction<DeploymentRegionState>) => payload,
    },
});

export const thunks = {
    /** NOTE: We don't try to hot swap, if the region is changed, we reload the app */
    "changeDeploymentRegion":
        (params: {
            deploymentRegionId: string;
            reload: () => never;
        }): ThunkAction<Promise<never>> =>
        async () => {
            const { deploymentRegionId, reload } = params;

            localStorage.setItem(localStorageKey, deploymentRegionId);

            reload();

            assert(false);
        },
};

export const privateThunks = {
    "initialize":
        (): ThunkAction =>
        async (...args) => {
            const [dispatch, , { onyxiaApiClient }] = args;

            const availableDeploymentRegions =
                await onyxiaApiClient.getAvailableRegions();

            let previouslySelectedRegionIdFromLocalStorage =
                localStorage.getItem(localStorageKey);

            if (
                previouslySelectedRegionIdFromLocalStorage !== null &&
                !availableDeploymentRegions
                    .map(({ id }) => id)
                    .includes(previouslySelectedRegionIdFromLocalStorage)
            ) {
                localStorage.removeItem(localStorageKey);
                previouslySelectedRegionIdFromLocalStorage = null;
            }

            dispatch(
                actions.initialize({
                    availableDeploymentRegions,
                    "selectedDeploymentRegionId":
                        previouslySelectedRegionIdFromLocalStorage ??
                        availableDeploymentRegions[0].id,
                }),
            );
        },
};

export const selectors = (() => {
    const selectedDeploymentRegion = (rootState: RootState): DeploymentRegion => {
        const { selectedDeploymentRegionId, availableDeploymentRegions } =
            rootState.deploymentRegion;

        const selectedDeploymentRegion = availableDeploymentRegions.find(
            ({ id }) => id === selectedDeploymentRegionId,
        );

        assert(selectedDeploymentRegion !== undefined);

        return selectedDeploymentRegion;
    };

    return { selectedDeploymentRegion };
})();

const localStorageKey = "selectedDeploymentRegionId";
