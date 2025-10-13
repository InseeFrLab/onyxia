import { createSelector } from "clean-architecture";
import * as deploymentRegionManagement from "core/usecases/deploymentRegionManagement";
import * as projectManagement from "core/usecases/projectManagement";
import * as s3ConfigConnectionTest from "core/usecases/s3ConfigConnectionTest";
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
        deploymentRegion => deploymentRegion.s3Configs
    ),
    resolvedTemplatedBookmarks,
    s3ConfigConnectionTest.protectedSelectors.configTestResults,
    s3ConfigConnectionTest.protectedSelectors.ongoingConfigTests,
    (
        projectConfigS3,
        s3Configs_region,
        resolvedTemplatedBookmarks,
        configTestResults,
        ongoingConfigTests
    ): S3Profile[] =>
        aggregateS3ProfilesFromVaultAndRegionIntoAnUnifiedSet({
            fromVault: projectConfigS3,
            fromRegion: s3Configs_region.map((s3Config, i) => ({
                s3Config,
                bookmarks: (() => {
                    const entry = resolvedTemplatedBookmarks.find(
                        entry => entry.correspondingS3ConfigIndexInRegion === i
                    );

                    assert(entry !== undefined);

                    return entry.bookmarks;
                })()
            })),
            connectionTestsState: {
                results: configTestResults,
                ongoing: ongoingConfigTests
            }
        })
);

export const selectors = { s3Profiles };

export const privateSelectors = {
    resolvedTemplatedBookmarks
};
