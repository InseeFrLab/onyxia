import { createSelector } from "clean-architecture";
import type { LocalizedString } from "core/ports/OnyxiaApi";
import * as deploymentRegionManagement from "core/usecases/deploymentRegionManagement";
import * as projectManagement from "core/usecases/projectManagement";
import * as s3ConfigConnectionTest from "core/usecases/s3ConfigConnectionTest";
import * as userAuthentication from "core/usecases/userAuthentication";
import { assert } from "tsafe/assert";
import { exclude } from "tsafe/exclude";
import { getS3Configs, type S3Config } from "./decoupledLogic/getS3Configs";
import { name } from "./state";
import type { State as RootState } from "core/bootstrap";

const resolvedAdminBookmarks = createSelector(
    (state: RootState) => state[name],
    state => state.resolvedAdminBookmarks
);

const s3Configs = createSelector(
    createSelector(
        projectManagement.protectedSelectors.projectConfig,
        projectConfig => projectConfig.s3
    ),
    createSelector(
        deploymentRegionManagement.selectors.currentDeploymentRegion,
        deploymentRegion => deploymentRegion.s3Configs
    ),
    resolvedAdminBookmarks,
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
    createSelector(projectManagement.protectedSelectors.projects, projects => {
        return projects
            .map(({ name, group }) => (group === undefined ? undefined : { name, group }))
            .filter(exclude(undefined));
    }),
    (
        projectConfigsS3,
        s3RegionConfigs,
        resolvedAdminBookmarks,
        configTestResults,
        ongoingConfigTests,
        username,
        projectGroup,
        groupProjects
    ): S3Config[] =>
        getS3Configs({
            projectConfigsS3,
            s3RegionConfigs,
            resolvedAdminBookmarks,
            configTestResults,
            ongoingConfigTests,
            username,
            projectGroup,
            groupProjects
        })
);

type IndexedS3Locations =
    | IndexedS3Locations.AdminCreatedS3Config
    | IndexedS3Locations.UserCreatedS3Config;

namespace IndexedS3Locations {
    export namespace AdminCreatedS3Config {
        type Common = { directoryPath: string };

        export type PersonalLocation = Common & {
            type: "personal";
        };

        export type ProjectLocation = Common & {
            type: "project";
            projectName: string;
        };
        export type AdminBookmarkLocation = Common & {
            type: "bookmark";
            title: LocalizedString;
            description?: LocalizedString;
            tags: LocalizedString[] | undefined;
        };

        export type Location = PersonalLocation | ProjectLocation | AdminBookmarkLocation;
    }

    export type AdminCreatedS3Config = {
        type: "admin created s3 config";
        locations: AdminCreatedS3Config.Location[];
    };

    export type UserCreatedS3Config = {
        type: "user created s3 config";
        directoryPath: string;
        dataSource: string;
    };
}

const indexedS3Locations = createSelector(s3Configs, (s3Configs): IndexedS3Locations => {
    const s3Config = s3Configs.find(({ isExplorerConfig }) => isExplorerConfig);

    assert(s3Config !== undefined);

    switch (s3Config.origin) {
        case "deploymentRegion":
            return {
                type: "admin created s3 config",
                locations: s3Config.locations
            };
        case "project":
            return {
                type: "user created s3 config",
                directoryPath: s3Config.workingDirectoryPath,
                dataSource: s3Config.dataSource
            };
    }
});

export const selectors = { s3Configs, indexedS3Locations };

export const privateSelectors = {
    resolvedAdminBookmarks
};
