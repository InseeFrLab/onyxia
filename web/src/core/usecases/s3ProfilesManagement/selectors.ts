import { createSelector } from "clean-architecture";
import * as projectManagement from "core/usecases/projectManagement";
import * as userConfigs from "core/usecases/userConfigs";
import { createS3Profiles } from "./decoupledLogic/s3Profiles";
import { name } from "./state";
import type { State as RootState } from "core/bootstrap";
import { getRootContext } from "core/rootContext";
import { assert } from "tsafe";

const state = (rootState: RootState) => rootState[name];

const s3Profiles = createSelector(
    (state: RootState) => {
        const { oidc } = getRootContext();

        if (!oidc.isUserLoggedIn) {
            return undefined;
        }
        return projectManagement.protectedSelectors.projectConfigs(state).s3Profiles;
    },
    (state: RootState) => {
        const { oidc } = getRootContext();

        if (!oidc.isUserLoggedIn) {
            return undefined;
        }
        return userConfigs.selectors.userConfigs(state).s3BookmarksStr;
    },
    createSelector(state, state => state.decodedIdTokens),
    (projectConfigs_s3Profiles, userConfigs_s3BookmarksStr, decodedIdTokens) =>
        createS3Profiles({
            onyxiaInstanceS3ConfigEntries: getRootContext().s3Config.entries,
            userData: (() => {
                if (decodedIdTokens === undefined) {
                    return undefined;
                }

                assert(projectConfigs_s3Profiles !== undefined);
                assert(userConfigs_s3BookmarksStr !== undefined);

                return {
                    decodedIdTokens,
                    userConfigs_s3BookmarksStr,
                    projectConfigs_s3Profiles
                };
            })()
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
            s3Profiles.find(
                s3Profile =>
                    s3Profile.origin === "onyxia instance config (setup by admin)"
            ) ??
            s3Profiles.find(() => true)
        );
    }
);

export const selectors = {
    s3Profiles,
    ambientS3Profile
};
