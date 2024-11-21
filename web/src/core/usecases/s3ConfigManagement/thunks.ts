import type { Thunks } from "core/bootstrap";
import { selectors } from "./selectors";
import type { S3Config } from "./decoupledLogic/getS3Configs";
import * as projectManagement from "core/usecases/projectManagement";
import type { ProjectConfigs } from "core/usecases/projectManagement";
import { assert } from "tsafe/assert";
import type { S3Client } from "core/ports/S3Client";
import { createOidcOrFallback } from "core/adapters/oidc/utils/createOidcOrFallback";
import { createUsecaseContextApi } from "clean-architecture";
import { getProjectS3ConfigId } from "./decoupledLogic/projectS3ConfigId";
import * as s3ConfigConnectionTest from "core/usecases/s3ConfigConnectionTest";
import { updateDefaultS3ConfigsAfterPotentialDeletion } from "./decoupledLogic/updateDefaultS3ConfigsAfterPotentialDeletion";
import structuredClone from "@ungap/structured-clone";
import * as deploymentRegionManagement from "core/usecases/deploymentRegionManagement";

export const thunks = {
    testS3Connection:
        (params: { projectS3ConfigId: string }) =>
        async (...args) => {
            const { projectS3ConfigId } = params;
            const [dispatch, getState] = args;

            const s3Configs = selectors.s3Configs(getState());

            const s3Config = s3Configs.find(
                s3Config => s3Config.id === projectS3ConfigId
            );

            assert(s3Config !== undefined);
            assert(s3Config.origin === "project");

            await dispatch(
                s3ConfigConnectionTest.protectedThunks.testS3Connection({
                    paramsOfCreateS3Client: s3Config.paramsOfCreateS3Client,
                    workingDirectoryPath: s3Config.workingDirectoryPath
                })
            );
        },
    deleteS3Config:
        (params: { projectS3ConfigId: string }) =>
        async (...args) => {
            const { projectS3ConfigId } = params;

            const [dispatch, getState] = args;

            const projectConfigsS3 = structuredClone(
                projectManagement.protectedSelectors.projectConfig(getState()).s3
            );

            const i = projectConfigsS3.s3Configs.findIndex(
                projectS3Config_i =>
                    getProjectS3ConfigId({
                        creationTime: projectS3Config_i.creationTime
                    }) === projectS3ConfigId
            );

            assert(i !== -1);

            projectConfigsS3.s3Configs.splice(i, 1);

            {
                const actions = updateDefaultS3ConfigsAfterPotentialDeletion({
                    projectConfigsS3,
                    s3RegionConfigs:
                        deploymentRegionManagement.selectors.currentDeploymentRegion(
                            getState()
                        ).s3Configs
                });

                await Promise.all(
                    (["s3ConfigId_defaultXOnyxia", "s3ConfigId_explorer"] as const).map(
                        async propertyName => {
                            const action = actions[propertyName];

                            if (!action.isUpdateNeeded) {
                                return;
                            }

                            projectConfigsS3[propertyName] = action.s3ConfigId;
                        }
                    )
                );
            }

            await dispatch(
                projectManagement.protectedThunks.updateConfigValue({
                    key: "s3",
                    value: projectConfigsS3
                })
            );
        },
    changeIsDefault:
        (params: {
            s3ConfigId: string;
            usecase: "defaultXOnyxia" | "explorer";
            value: boolean;
        }) =>
        async (...args) => {
            const { s3ConfigId, usecase, value } = params;

            const [dispatch, getState] = args;

            const projectConfigsS3 = structuredClone(
                projectManagement.protectedSelectors.projectConfig(getState()).s3
            );

            const propertyName = (() => {
                switch (usecase) {
                    case "defaultXOnyxia":
                        return "s3ConfigId_defaultXOnyxia";
                    case "explorer":
                        return "s3ConfigId_explorer";
                }
            })();

            {
                const currentDefault = projectConfigsS3[propertyName];

                if (value) {
                    if (currentDefault === s3ConfigId) {
                        return;
                    }
                } else {
                    if (currentDefault !== s3ConfigId) {
                        return;
                    }
                }
            }

            projectConfigsS3[propertyName] = value ? s3ConfigId : undefined;

            await dispatch(
                projectManagement.protectedThunks.updateConfigValue({
                    key: "s3",
                    value: projectConfigsS3
                })
            );
        }
} satisfies Thunks;

export const protectedThunks = {
    getS3ClientForSpecificConfig:
        (params: { s3ConfigId: string | undefined }) =>
        async (...args): Promise<S3Client> => {
            const { s3ConfigId } = params;
            const [, getState, rootContext] = args;

            const { s3ClientByConfigId } = getContext(rootContext);

            const s3Config = (() => {
                const s3Configs = selectors.s3Configs(getState());

                const s3Config = s3Configs.find(s3Config => s3Config.id === s3ConfigId);
                assert(s3Config !== undefined);

                return s3Config;
            })();

            use_cached_s3Client: {
                const s3Client = s3ClientByConfigId.get(s3Config.id);

                if (s3Client === undefined) {
                    break use_cached_s3Client;
                }

                return s3Client;
            }

            const { createS3Client } = await import("core/adapters/s3Client");

            const { oidc } = rootContext;

            assert(oidc.isUserLoggedIn);

            const s3Client = createS3Client(s3Config.paramsOfCreateS3Client, oidcParams =>
                createOidcOrFallback({
                    oidcParams,
                    fallbackOidc: oidc
                })
            );

            s3ClientByConfigId.set(s3Config.id, s3Client);

            return s3Client;
        },
    getS3ConfigAndClientForExplorer:
        () =>
        async (
            ...args
        ): Promise<undefined | { s3Client: S3Client; s3Config: S3Config }> => {
            const [dispatch, getState] = args;

            const s3Config = selectors
                .s3Configs(getState())
                .find(s3Config => s3Config.isExplorerConfig);

            if (s3Config === undefined) {
                return undefined;
            }

            const s3Client = await dispatch(
                protectedThunks.getS3ClientForSpecificConfig({
                    s3ConfigId: s3Config.id
                })
            );

            return { s3Client, s3Config };
        },
    createS3Config:
        (params: { projectS3Config: ProjectConfigs.S3Config }) =>
        async (...args) => {
            const { projectS3Config } = params;

            const [dispatch, getState] = args;

            const projectConfigsS3 = structuredClone(
                projectManagement.protectedSelectors.projectConfig(getState()).s3
            );

            const i = projectConfigsS3.s3Configs.findIndex(
                projectS3Config_i =>
                    getProjectS3ConfigId({
                        creationTime: projectS3Config_i.creationTime
                    }) ===
                    getProjectS3ConfigId({
                        creationTime: projectS3Config.creationTime
                    })
            );

            if (i < 0) {
                projectConfigsS3.s3Configs.push(projectS3Config);
            } else {
                projectConfigsS3.s3Configs[i] = projectS3Config;
            }

            await dispatch(
                projectManagement.protectedThunks.updateConfigValue({
                    key: "s3",
                    value: projectConfigsS3
                })
            );
        }
} satisfies Thunks;

const { getContext } = createUsecaseContextApi(() => ({
    s3ClientByConfigId: new Map<string, S3Client>()
}));
