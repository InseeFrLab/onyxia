import { assert } from "tsafe/assert";
import type { DeploymentRegion } from "../ports/OnyxiaApi";
import {
    createUsecaseActions,
    createObjectThatThrowsIfAccessed
} from "redux-clean-architecture";
import type { State as RootState, Thunks } from "core/bootstrap";

type State = {
    availableDeploymentRegions: DeploymentRegion[];
    selectedDeploymentRegionId: string;
};

export const name = "deploymentRegion";

export const { reducer, actions } = createUsecaseActions({
    name,
    "initialState": createObjectThatThrowsIfAccessed<State>(),
    "reducers": {
        "initialize": (_, { payload }: { payload: State }) => payload
    }
});

export const thunks = {
    /** NOTE: We don't try to hot swap, if the region is changed, we reload the app */
    "changeDeploymentRegion":
        (params: { deploymentRegionId: string; reload: () => never }) => (): never => {
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

            const { regions: availableDeploymentRegions } =
                await onyxiaApi.getAvailableRegionsAndOidcParams();

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
            rootState[name];

        const selectedDeploymentRegion = availableDeploymentRegions.find(
            ({ id }) => id === selectedDeploymentRegionId
        );

        assert(selectedDeploymentRegion !== undefined);

        return selectedDeploymentRegion;
    };

    const availableDeploymentRegionIds = (rootState: RootState): string[] =>
        rootState[name].availableDeploymentRegions.map(({ id }) => id);

    return { selectedDeploymentRegion, availableDeploymentRegionIds };
})();

const localStorageKey = "selectedDeploymentRegionId";
