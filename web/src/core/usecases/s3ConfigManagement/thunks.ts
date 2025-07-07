import type { Thunks } from "core/bootstrap";
import { selectors, privateSelectors } from "./selectors";
import type { S3Config } from "./decoupledLogic/getS3Configs";
import * as projectManagement from "core/usecases/projectManagement";
import type { ProjectConfigs } from "core/usecases/projectManagement";
import { assert } from "tsafe/assert";
import type { S3Client } from "core/ports/S3Client";
import { createUsecaseContextApi } from "clean-architecture";
import { getProjectS3ConfigId } from "./decoupledLogic/projectS3ConfigId";
import * as s3ConfigConnectionTest from "core/usecases/s3ConfigConnectionTest";
import { updateDefaultS3ConfigsAfterPotentialDeletion } from "./decoupledLogic/updateDefaultS3ConfigsAfterPotentialDeletion";
import structuredClone from "@ungap/structured-clone";
import * as deploymentRegionManagement from "core/usecases/deploymentRegionManagement";
import { fnv1aHashToHex } from "core/tools/fnv1aHashToHex";
import { resolveS3AdminBookmarks } from "./decoupledLogic/resolveS3AdminBookmarks";
import { actions } from "./state";

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

            const { prS3ClientByConfigId } = getContext(rootContext);

            const s3Config = (() => {
                const s3Configs = selectors.s3Configs(getState());

                const s3Config = s3Configs.find(s3Config => s3Config.id === s3ConfigId);
                assert(s3Config !== undefined);

                return s3Config;
            })();

            use_cached_s3Client: {
                const prS3Client = prS3ClientByConfigId.get(s3Config.id);

                if (prS3Client === undefined) {
                    break use_cached_s3Client;
                }

                return prS3Client;
            }

            const prS3Client = (async () => {
                const { createS3Client } = await import("core/adapters/s3Client");
                const { createOidc, mergeOidcParams } = await import(
                    "core/adapters/oidc"
                );
                const { paramsOfBootstrapCore, onyxiaApi } = rootContext;

                return createS3Client(
                    s3Config.paramsOfCreateS3Client,
                    async oidcParams_partial => {
                        const { oidcParams } =
                            await onyxiaApi.getAvailableRegionsAndOidcParams();

                        assert(oidcParams !== undefined);

                        const oidc_s3 = await createOidc({
                            ...mergeOidcParams({
                                oidcParams,
                                oidcParams_partial
                            }),
                            autoLogin: true,
                            transformBeforeRedirectForKeycloakTheme:
                                paramsOfBootstrapCore.transformBeforeRedirectForKeycloakTheme,
                            getCurrentLang: paramsOfBootstrapCore.getCurrentLang,
                            enableDebugLogs: paramsOfBootstrapCore.enableOidcDebugLogs
                        });

                        const doClearCachedS3Token_groupClaimValue: boolean =
                            await (async () => {
                                const { projects } = await onyxiaApi.getUserAndProjects();

                                const KEY = "onyxia:s3:projects-hash";

                                const hash = fnv1aHashToHex(JSON.stringify(projects));

                                if (
                                    !oidc_s3.isNewBrowserSession &&
                                    sessionStorage.getItem(KEY) === hash
                                ) {
                                    return false;
                                }

                                sessionStorage.setItem(KEY, hash);
                                return true;
                            })();

                        const doClearCachedS3Token_s3BookmarkClaimValue: boolean =
                            (() => {
                                const resolvedAdminBookmarks =
                                    privateSelectors.resolvedAdminBookmarks(getState());

                                const KEY = "onyxia:s3:resolvedAdminBookmarks-hash";

                                const hash = fnv1aHashToHex(
                                    JSON.stringify(resolvedAdminBookmarks)
                                );

                                if (
                                    !oidc_s3.isNewBrowserSession &&
                                    sessionStorage.getItem(KEY) === hash
                                ) {
                                    return false;
                                }

                                sessionStorage.setItem(KEY, hash);
                                return true;
                            })();

                        return {
                            oidc: oidc_s3,
                            doClearCachedS3Token:
                                doClearCachedS3Token_groupClaimValue ||
                                doClearCachedS3Token_s3BookmarkClaimValue
                        };
                    }
                );
            })();

            prS3ClientByConfigId.set(s3Config.id, prS3Client);

            return prS3Client;
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
        },

    initialize:
        () =>
        async (...args) => {
            const [dispatch, getState, { onyxiaApi, paramsOfBootstrapCore }] = args;

            const { oidcParams } = await onyxiaApi.getAvailableRegionsAndOidcParams();

            if (oidcParams === undefined) {
                dispatch(actions.initialized({ resolvedAdminBookmarks: [] }));
                return;
            }
            const deploymentRegion =
                deploymentRegionManagement.selectors.currentDeploymentRegion(getState());

            const { resolvedAdminBookmarks } = await resolveS3AdminBookmarks({
                deploymentRegion_s3Configs: deploymentRegion.s3Configs,
                getDecodedIdToken: async ({ oidcParams_partial }) => {
                    const { createOidc, mergeOidcParams } = await import(
                        "core/adapters/oidc"
                    );

                    const oidc = await createOidc({
                        ...mergeOidcParams({
                            oidcParams,
                            oidcParams_partial
                        }),
                        autoLogin: true,
                        transformBeforeRedirectForKeycloakTheme:
                            paramsOfBootstrapCore.transformBeforeRedirectForKeycloakTheme,
                        getCurrentLang: paramsOfBootstrapCore.getCurrentLang,
                        enableDebugLogs: paramsOfBootstrapCore.enableOidcDebugLogs
                    });

                    const { decodedIdToken } = await oidc.getTokens();

                    return decodedIdToken;
                }
            });

            dispatch(actions.initialized({ resolvedAdminBookmarks }));
        }
} satisfies Thunks;

const { getContext } = createUsecaseContextApi(() => ({
    prS3ClientByConfigId: new Map<string, Promise<S3Client>>()
}));
