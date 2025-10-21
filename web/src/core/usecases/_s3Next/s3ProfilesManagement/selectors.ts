import { createSelector } from "clean-architecture";
import * as deploymentRegionManagement from "core/usecases/deploymentRegionManagement";
import * as projectManagement from "core/usecases/projectManagement";
import * as s3CredentialsTest from "core/usecases/_s3Next/s3CredentialsTest";
import { assert } from "tsafe/assert";
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
    s3CredentialsTest.protectedSelectors.credentialsTestState,
    (
        projectConfigS3,
        s3Profiles_region,
        resolvedTemplatedBookmarks,
        credentialsTestState
    ): S3Profile[] =>
        aggregateS3ProfilesFromVaultAndRegionIntoAnUnifiedSet({
            fromVault: projectConfigS3,
            fromRegion: s3Profiles_region.map((s3Profile, i) => ({
                ...s3Profile,
                bookmarks: (() => {
                    const entry = resolvedTemplatedBookmarks.find(
                        entry => entry.correspondingS3ConfigIndexInRegion === i
                    );

                    assert(entry !== undefined);

                    return entry.bookmarks;
                })()
            })),
            credentialsTestState
        })
);

export const selectors = { s3Profiles };

export const protectedSelectors = {
    resolvedTemplatedBookmarks
};
