import { assert } from "tsafe/assert";
import type { Thunks } from "../core";
import type { DeploymentRegion } from "../ports/OnyxiaApi";
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { createObjectThatThrowsIfAccessed } from "redux-clean-architecture";
import type { State as RootState } from "../core";

type State = {
    availableDeploymentRegions: DeploymentRegion[];
    selectedDeploymentRegionId: string;
};

export const name = "deploymentRegion";

export const { reducer, actions } = createSlice({
    name,
    "initialState": createObjectThatThrowsIfAccessed<State>(),
    "reducers": {
        "initialize": (_, { payload }: PayloadAction<State>) => payload
    }
});

export const thunks = {
    /** NOTE: We don't try to hot swap, if the region is changed, we reload the app */
    "changeDeploymentRegion":
        (params: { deploymentRegionId: string; reload: () => never }) =>
        async (): Promise<never> => {
            const { deploymentRegionId, reload } = params;

            localStorage.setItem(localStorageKey, deploymentRegionId);

            reload();

            assert(false);
        }
} satisfies Thunks;

export const protectedThunks = {
    "initialize":
        () =>
        async (...args) => {
            const [dispatch, , { onyxiaApi }] = args;

            const availableDeploymentRegions = await onyxiaApi.getAvailableRegions();

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
                        availableDeploymentRegions[0].id
                })
            );
        }
} satisfies Thunks;

export const selectors = (() => {
    const selectedDeploymentRegion = (rootState: RootState): DeploymentRegion => {
        const { selectedDeploymentRegionId, availableDeploymentRegions } =
            rootState.deploymentRegion;

        const selectedDeploymentRegion = availableDeploymentRegions.find(
            ({ id }) => id === selectedDeploymentRegionId
        );

        assert(selectedDeploymentRegion !== undefined);

        return selectedDeploymentRegion;
    };

    return { selectedDeploymentRegion };
})();

const localStorageKey = "selectedDeploymentRegionId";
