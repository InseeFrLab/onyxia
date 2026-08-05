import { createSelector } from "clean-architecture";
import * as projectManagement from "core/usecases/projectManagement";
import * as userConfigs from "core/usecases/userConfigs";
import {
    type S3Profile,
    aggregateS3ProfilesFromVaultAndRegionIntoAnUnifiedSet
} from "./decoupledLogic/s3Profiles";
import { name } from "./state";
import type { State as RootState } from "core/bootstrap";
import { getRootContext } from "core/rootContext";

const state = (rootState: RootState) => rootState[name];

const resolvedTemplatedBookmarks = createSelector(
    state,
    state => state.resolvedTemplatedBookmarks
);

const resolvedTemplatedStsRoles = createSelector(
    state,
    state => state.resolvedTemplatedStsRoles
);

const userConfigs_s3BookmarksStr = createSelector(
    userConfigs.selectors.userConfigs,
    userConfigs => userConfigs.s3BookmarksStr
);

const s3Profiles = createSelector(
    createSelector(
        projectManagement.protectedSelectors.projectConfig,
        projectConfig => projectConfig.s3Profiles
    ),
    resolvedTemplatedBookmarks,
    resolvedTemplatedStsRoles,
    userConfigs_s3BookmarksStr,
    (
        s3Profiles_vault,
        resolvedTemplatedBookmarks,
        resolvedTemplatedStsRoles,
        userConfigs_s3BookmarksStr
    ): S3Profile[] =>
        aggregateS3ProfilesFromVaultAndRegionIntoAnUnifiedSet({
            fromVault: {
                s3Profiles: s3Profiles_vault,
                userConfigs_s3BookmarksStr
            },
            fromConfig: {
                entries: getRootContext().s3Config.entries,
                resolvedTemplatedBookmarks,
                resolvedTemplatedStsRoles
            }
        })
);

const ambientS3Profile = createSelector(
    s3Profiles,
    createSelector(state, state => state.ambientProfileName),
    (s3Profiles, ambientProfileName) => {
        return (
            s3Profiles.find(
                ambientProfileName === undefined
                    ? () => false
                    : s3Profiles => s3Profiles.profileName === ambientProfileName
            ) ??
            s3Profiles.find(s3Profile => s3Profile.profileName === "default") ??
            s3Profiles.find(s3Profile => s3Profile.origin === "defined in region") ??
            s3Profiles.find(() => true)
        );
    }
);

export const privateSelectors = {
    resolvedTemplatedBookmarks
};

export const selectors = {
    s3Profiles,
    ambientS3Profile
};
