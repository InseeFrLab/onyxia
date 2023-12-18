import type { DeploymentRegion } from "core/ports/OnyxiaApi";
import {
    createUsecaseActions,
    createObjectThatThrowsIfAccessed
} from "redux-clean-architecture";

type State = {
    availableDeploymentRegions: DeploymentRegion[];
    currentDeploymentRegionId: string;
};

export const name = "regionSelection";

export const { reducer, actions } = createUsecaseActions({
    name,
    "initialState": createObjectThatThrowsIfAccessed<State>(),
    "reducers": {
        "initialize": (_, { payload }: { payload: State }) => payload
    }
});
