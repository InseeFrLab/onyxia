import { assert } from "tsafe/assert";
import type { ThunkAction } from "../setup";
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
        async (...args) => {
            const { deploymentRegionId, reload } = params;

            const [dispatch, , { oidcClient }] = args;

            if (oidcClient.isUserLoggedIn) {
                await dispatch(
                    userConfigsThunks.changeValue({
                        "key": "deploymentRegionId",
                        "value": deploymentRegionId,
                    }),
                );
            } else {
                localStorage.setItem(localStorageKey, deploymentRegionId);
            }

            reload();

            assert(false);
        },
};

export const privateThunks = {
    "initialize":
        (): ThunkAction =>
        async (...args) => {
            const [dispatch, getState, { onyxiaApiClient, oidcClient }] = args;

            const availableDeploymentRegions =
                await onyxiaApiClient.getAvailableRegions();

            const getAvailablePreviouslySelectedRegionIdFromLocalStorage = () => {
                const value = localStorage.getItem(localStorageKey);

                if (
                    value !== null &&
                    !availableDeploymentRegions.map(({ id }) => id).includes(value)
                ) {
                    localStorage.removeItem(localStorageKey);

                    return null;
                }

                return value;
            };

            if (!oidcClient.isUserLoggedIn) {
                dispatch(
                    actions.initialize({
                        availableDeploymentRegions,
                        "selectedDeploymentRegionId":
                            getAvailablePreviouslySelectedRegionIdFromLocalStorage() ??
                            availableDeploymentRegions[0].id,
                    }),
                );

                return;
            }

            {
                const selectedDeploymentRegionId =
                    getAvailablePreviouslySelectedRegionIdFromLocalStorage();

                localStorage.removeItem(localStorageKey);

                if (selectedDeploymentRegionId !== null) {
                    await dispatch(
                        userConfigsThunks.changeValue({
                            "key": "deploymentRegionId",
                            "value": selectedDeploymentRegionId,
                        }),
                    );

                    dispatch(
                        actions.initialize({
                            availableDeploymentRegions,
                            selectedDeploymentRegionId,
                        }),
                    );

                    return;
                }
            }

            {
                const selectedDeploymentRegionId =
                    getState().userConfigs.deploymentRegionId.value;

                if (
                    selectedDeploymentRegionId !== null &&
                    availableDeploymentRegions
                        .map(({ id }) => id)
                        .includes(selectedDeploymentRegionId)
                ) {
                    dispatch(
                        actions.initialize({
                            availableDeploymentRegions,
                            selectedDeploymentRegionId,
                        }),
                    );

                    return;
                }
            }

            {
                const deploymentRegionId = availableDeploymentRegions[0].id;

                await dispatch(
                    userConfigsThunks.changeValue({
                        "key": "deploymentRegionId",
                        "value": deploymentRegionId,
                    }),
                );

                dispatch(
                    actions.initialize({
                        availableDeploymentRegions,
                        "selectedDeploymentRegionId": deploymentRegionId,
                    }),
                );
            }
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
