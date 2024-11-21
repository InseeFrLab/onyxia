import { assert } from "tsafe/assert";
import type { Thunks } from "core/bootstrap";
import { actions } from "./state";

export const thunks = {
    /** NOTE: We don't try to hot swap, if the region is changed, we reload the app */
    changeDeploymentRegion:
        (params: { deploymentRegionId: string; reload: () => never }) => (): never => {
            const { deploymentRegionId, reload } = params;

            localStorage.setItem(localStorageKey, deploymentRegionId);

            reload();

            assert(false);
        }
} satisfies Thunks;

export const protectedThunks = {
    initialize:
        () =>
        async (...args) => {
            const [dispatch, , { onyxiaApi }] = args;

            const { regions: availableDeploymentRegions } =
                await onyxiaApi.getAvailableRegionsAndOidcParams();

            let previousRegionIdFromLocalStorage = localStorage.getItem(localStorageKey);

            if (
                previousRegionIdFromLocalStorage !== null &&
                !availableDeploymentRegions
                    .map(({ id }) => id)
                    .includes(previousRegionIdFromLocalStorage)
            ) {
                localStorage.removeItem(localStorageKey);
                previousRegionIdFromLocalStorage = null;
            }

            dispatch(
                actions.initialize({
                    availableDeploymentRegions,
                    currentDeploymentRegionId:
                        previousRegionIdFromLocalStorage ??
                        availableDeploymentRegions[0].id
                })
            );
        }
} satisfies Thunks;

const localStorageKey = "currentDeploymentRegionId";
