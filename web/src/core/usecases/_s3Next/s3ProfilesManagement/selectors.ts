import { createSelector } from "clean-architecture";
import * as deploymentRegionManagement from "core/usecases/deploymentRegionManagement";
import * as projectManagement from "core/usecases/projectManagement";
import * as userConfigs from "core/usecases/userConfigs";
import {
    type S3Profile,
    aggregateS3ProfilesFromVaultAndRegionIntoAnUnifiedSet
} from "./decoupledLogic/s3Profiles";
import { name } from "./state";
import type { State as RootState } from "core/bootstrap";
import * as userAuthentication from "core/usecases/userAuthentication";

const resolvedTemplatedBookmarks = createSelector(
    (state: RootState) => state[name],
    state => state.resolvedTemplatedBookmarks
);

const resolvedTemplatedStsRoles = createSelector(
    (state: RootState) => state[name],
    state => state.resolvedTemplatedStsRoles
);

const userConfigs_s3BookmarksStr = createSelector(
    userConfigs.selectors.userConfigs,
    userConfigs => userConfigs.s3BookmarksStr
);

const s3Profiles = createSelector(
    createSelector(
        projectManagement.protectedSelectors.projectConfig,
        projectConfig => projectConfig.s3
    ),
    createSelector(
        deploymentRegionManagement.selectors.currentDeploymentRegion,
        deploymentRegion => deploymentRegion._s3Next.s3Profiles
    ),
    resolvedTemplatedBookmarks,
    resolvedTemplatedStsRoles,
    userConfigs_s3BookmarksStr,
    (
        projectConfigs_s3,
        s3Profiles_region,
        resolvedTemplatedBookmarks,
        resolvedTemplatedStsRoles,
        userConfigs_s3BookmarksStr
    ): S3Profile[] =>
        aggregateS3ProfilesFromVaultAndRegionIntoAnUnifiedSet({
            fromVault: {
                projectConfigs_s3,
                userConfigs_s3BookmarksStr
            },
            fromRegion: {
                s3Profiles: s3Profiles_region,
                resolvedTemplatedBookmarks,
                resolvedTemplatedStsRoles
            }
        })
);

/** Can be used even when not authenticated */
const isS3ExplorerEnabled = (rootState: RootState) => {
    const { isUserLoggedIn } = userAuthentication.selectors.main(rootState);

    if (!isUserLoggedIn) {
        const { s3Configs } =
            deploymentRegionManagement.selectors.currentDeploymentRegion(rootState);

        return s3Configs.length !== 0;
    } else {
        return (
            s3Profiles(rootState).find(s3Profile => s3Profile.isExplorerConfig) !==
            undefined
        );
    }
};

export const selectors = { s3Profiles, isS3ExplorerEnabled };

export const protectedSelectors = {
    resolvedTemplatedBookmarks
};
