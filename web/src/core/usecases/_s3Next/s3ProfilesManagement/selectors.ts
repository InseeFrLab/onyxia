import { createSelector } from "clean-architecture";
import * as deploymentRegionManagement from "core/usecases/deploymentRegionManagement";
import * as projectManagement from "core/usecases/projectManagement";
import * as s3CredentialsTest from "core/usecases/_s3Next/s3CredentialsTest";
import {
    type S3Profile,
    aggregateS3ProfilesFromVaultAndRegionIntoAnUnifiedSet
} from "./decoupledLogic/s3Profiles";
import { name } from "./state";
import type { State as RootState } from "core/bootstrap";

const resolvedTemplatedBookmarks = createSelector(
    (state: RootState) => state[name],
    state => state.resolvedTemplatedBookmarks
);

const resolvedTemplatedStsRoles = createSelector(
    (state: RootState) => state[name],
    state => state.resolvedTemplatedStsRoles
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
    s3CredentialsTest.protectedSelectors.credentialsTestState,
    (
        projectConfigS3,
        s3Profiles_region,
        resolvedTemplatedBookmarks,
        resolvedTemplatedStsRoles,
        credentialsTestState
    ): S3Profile[] =>
        aggregateS3ProfilesFromVaultAndRegionIntoAnUnifiedSet({
            fromVault: projectConfigS3,
            fromRegion: {
                s3Profiles: s3Profiles_region,
                resolvedTemplatedBookmarks,
                resolvedTemplatedStsRoles
            },
            credentialsTestState
        })
);

export const selectors = { s3Profiles };

export const protectedSelectors = {
    resolvedTemplatedBookmarks
};
