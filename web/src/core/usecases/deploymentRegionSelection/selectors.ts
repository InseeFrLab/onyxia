import { assert } from "tsafe/assert";
import type { DeploymentRegion } from "core/ports/OnyxiaApi";
import { name } from "./state";
import type { State as RootState } from "core/bootstrap";

const currentDeploymentRegion = (rootState: RootState): DeploymentRegion => {
    const { currentDeploymentRegionId, availableDeploymentRegions } = rootState[name];

    const selectedDeploymentRegion = availableDeploymentRegions.find(
        ({ id }) => id === currentDeploymentRegionId
    );

    assert(selectedDeploymentRegion !== undefined);

    return selectedDeploymentRegion;
};

const availableDeploymentRegionIds = (rootState: RootState): string[] =>
    rootState[name].availableDeploymentRegions.map(({ id }) => id);

export const selectors = { currentDeploymentRegion, availableDeploymentRegionIds };
