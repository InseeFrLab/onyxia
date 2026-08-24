import { createSelector } from "clean-architecture";
import * as projectManagement from "core/usecases/projectManagement";
import * as userConfigs from "core/usecases/userConfigs";
import { type S3Profile, createS3Profiles } from "./decoupledLogic/s3Profiles";
import { name } from "./state";
import type { State as RootState } from "core/bootstrap";
import { getRootContext } from "core/rootContext";

const state = (rootState: RootState) => rootState[name];

const s3Profiles = createSelector(
    createSelector(
        projectManagement.protectedSelectors.projectConfig,
        projectConfig => projectConfig.s3Profiles
    ),
    createSelector(
        userConfigs.selectors.userConfigs,
        userConfigs => userConfigs.s3BookmarksStr
    ),
    createSelector(state, state => state.decodedIdTokens),
    (
        s3Profiles_persistenceLayer,
        userConfigs_s3BookmarksStr,
        decodedIdTokens
    ): S3Profile[] =>
        createS3Profiles({
            persistenceLayerData: {
                s3Profiles: s3Profiles_persistenceLayer,
                userConfigs_s3BookmarksStr
            },
            onyxiaInstanceS3ConfigEntries: getRootContext().s3Config.entries,
            decodedIdTokens
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
            s3Profiles.find(s3Profile => s3Profile.origin === "onyxia instance config") ??
            s3Profiles.find(() => true)
        );
    }
);

export const selectors = {
    s3Profiles,
    ambientS3Profile
};
