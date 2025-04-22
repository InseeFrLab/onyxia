import type { State as RootState } from "core/bootstrap";
import { objectKeys } from "tsafe/objectKeys";
import { createSelector } from "clean-architecture";
import * as userAuthentication from "../userAuthentication";
import * as deploymentRegionManagement from "core/usecases/deploymentRegionManagement";
import { name, type State, type UserConfigs } from "./state";

export const selectors = (() => {
    const state = (rootState: RootState): State => rootState[name];

    const userConfigs = createSelector(state, state => {
        const userConfigs: any = {};

        objectKeys(state).forEach(key => (userConfigs[key] = state[key].value));

        return userConfigs as UserConfigs;
    });

    // NOTE: This will not crash even if the user is not logged in.
    const isDarkModeEnabled = (rootState: RootState): boolean | undefined => {
        const { isUserLoggedIn } = userAuthentication.selectors.main(rootState);

        if (!isUserLoggedIn) {
            return undefined;
        }

        return userConfigs(rootState).isDarkModeEnabled;
    };

    const isVaultEnabled = createSelector(
        deploymentRegionManagement.selectors.currentDeploymentRegion,
        deploymentRegion => deploymentRegion.vault !== undefined
    );

    return {
        userConfigs,
        userConfigsWithUpdateProgress: state,
        isDarkModeEnabled,
        isVaultEnabled
    };
})();
