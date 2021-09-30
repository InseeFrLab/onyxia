import { assert } from "tsafe/assert";
import type { AppThunk } from "../setup";
import type { DeploymentRegion } from "../ports/OnyxiaApiClient";
import { createSlice } from "@reduxjs/toolkit";
import { thunks as userConfigsThunks } from "./userConfigs";
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

export const name = "deploymentRegion";

const { createObjectThatThrowsIfAccessed } = createObjectThatThrowsIfAccessedFactory({
    "isPropertyWhitelisted": isPropertyAccessedByReduxOrStorybook,
});

const { reducer, actions } = createSlice({
    name,
    "initialState": createObjectThatThrowsIfAccessed<DeploymentRegionState>(),
    "reducers": {
        "initialize": (_, { payload }: PayloadAction<DeploymentRegionState>) => payload,
        "deploymentRegionChanged": (
            state,
            { payload }: PayloadAction<{ deploymentRegionId: string }>,
        ) => {
            const { deploymentRegionId } = payload;

            state.selectedDeploymentRegionId = deploymentRegionId;
        },
    },
});

export { reducer };

export const thunks = {
    "changeDeploymentRegion":
        (params: { deploymentRegionId: string }): AppThunk =>
        async (...args) => {
            const [dispatch] = args;

            const { deploymentRegionId } = params;

            await dispatch(
                userConfigsThunks.changeValue({
                    "key": "deploymentRegionId",
                    "value": deploymentRegionId,
                }),
            );

            dispatch(actions.deploymentRegionChanged({ deploymentRegionId }));
        },
};

export const privateThunks = {
    "initialize":
        (): AppThunk =>
        async (...args) => {
            const [dispatch, getState, dependencies] = args;

            const availableDeploymentRegions =
                await dependencies.onyxiaApiClient.getAvailableRegions();

            //TODO: Local storage for region when not logged in.

            if (getState().userConfigs.deploymentRegionId.value === null) {
                await dispatch(
                    userConfigsThunks.changeValue({
                        "key": "deploymentRegionId",
                        "value": availableDeploymentRegions[0].id,
                    }),
                );
            }

            dispatch(
                actions.initialize({
                    availableDeploymentRegions,
                    "selectedDeploymentRegionId":
                        getState().userConfigs.deploymentRegionId.value!,
                }),
            );
        },
};

export const selectors = (() => {
    const selectedDeploymentRegionSelector = (rootState: RootState): DeploymentRegion => {
        const { selectedDeploymentRegionId, availableDeploymentRegions } =
            rootState.deploymentRegion;

        const selectedDeploymentRegion = availableDeploymentRegions.find(
            ({ id }) => id === selectedDeploymentRegionId,
        );

        assert(selectedDeploymentRegion !== undefined);

        return selectedDeploymentRegion;
    };

    return { selectedDeploymentRegionSelector };
})();
