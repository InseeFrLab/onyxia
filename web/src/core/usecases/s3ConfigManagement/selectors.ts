import { createSelector } from "clean-architecture";
import * as projectManagement from "core/usecases/projectManagement";
import * as deploymentRegionManagement from "core/usecases/deploymentRegionManagement";
import * as userAuthentication from "core/usecases/userAuthentication";
import * as s3ConfigConnectionTest from "core/usecases/s3ConfigConnectionTest";
import { getS3Configs, type S3Config } from "./decoupledLogic/getS3Configs";
import { assert } from "tsafe/assert";

const s3Configs = createSelector(
    createSelector(
        projectManagement.protectedSelectors.projectConfig,
        projectConfig => projectConfig.s3
    ),
    createSelector(
        deploymentRegionManagement.selectors.currentDeploymentRegion,
        deploymentRegion => deploymentRegion.s3Configs
    ),
    s3ConfigConnectionTest.protectedSelectors.configTestResults,
    s3ConfigConnectionTest.protectedSelectors.ongoingConfigTests,
    createSelector(userAuthentication.selectors.main, ({ isUserLoggedIn, user }) => {
        assert(isUserLoggedIn);
        return user.username;
    }),
    createSelector(
        projectManagement.protectedSelectors.currentProject,
        project => project.group
    ),
    (
        projectConfigsS3,
        s3RegionConfigs,
        configTestResults,
        ongoingConfigTests,
        username,
        projectGroup
    ): S3Config[] =>
        getS3Configs({
            projectConfigsS3,
            s3RegionConfigs,
            configTestResults,
            ongoingConfigTests,
            username,
            projectGroup
        })
);

export const selectors = { s3Configs };
