import type { Thunks } from "core/bootstrap";
import { selectors, protectedSelectors } from "./selectors";
import * as projectManagement from "core/usecases/projectManagement";
import { assert } from "tsafe/assert";
import type { S3Client } from "core/ports/S3Client";
import { createUsecaseContextApi } from "clean-architecture";
import * as s3CredentialsTest from "core/usecases/_s3Next/s3CredentialsTest";
import { updateDefaultS3ProfilesAfterPotentialDeletion } from "./decoupledLogic/updateDefaultS3ProfilesAfterPotentialDeletion";
import structuredClone from "@ungap/structured-clone";
import * as deploymentRegionManagement from "core/usecases/deploymentRegionManagement";
import { fnv1aHashToHex } from "core/tools/fnv1aHashToHex";
import { resolveTemplatedBookmark } from "./decoupledLogic/resolveTemplatedBookmark";
import { actions } from "./state";
import type { S3Profile } from "./decoupledLogic/s3Profiles";

export const thunks = {
    testS3ProfileCredentials:
        (params: { s3ProfileId: string }) =>
        async (...args) => {
            const { s3ProfileId } = params;
            const [dispatch, getState] = args;

            const s3Profiles = selectors.s3Profiles(getState());

            const s3Profile = s3Profiles.find(s3Profile => s3Profile.id === s3ProfileId);

            assert(s3Profile !== undefined);

            await dispatch(
                s3CredentialsTest.protectedThunks.testS3Credentials({
                    paramsOfCreateS3Client: s3Profile.paramsOfCreateS3Client
                })
            );
        },
    deleteS3Config:
        (params: { s3ProfileCreationTime: number }) =>
        async (...args) => {
            const { s3ProfileCreationTime } = params;

            const [dispatch, getState] = args;

            const fromVault = structuredClone(
                projectManagement.protectedSelectors.projectConfig(getState()).s3
            );

            const i = fromVault.s3Configs.findIndex(
                ({ creationTime }) => creationTime === s3ProfileCreationTime
            );

            assert(i !== -1);

            fromVault.s3Configs.splice(i, 1);

            {
                const actions = updateDefaultS3ProfilesAfterPotentialDeletion({
                    fromRegion:
                        deploymentRegionManagement.selectors.currentDeploymentRegion(
                            getState()
                        )._s3Next.s3Profiles,
                    fromVault: fromVault
                });

                await Promise.all(
                    (["s3ConfigId_defaultXOnyxia", "s3ConfigId_explorer"] as const).map(
                        async propertyName => {
                            const action = actions[propertyName];

                            if (!action.isUpdateNeeded) {
                                return;
                            }

                            fromVault[propertyName] = action.s3ProfileId;
                        }
                    )
                );
            }

            await dispatch(
                projectManagement.protectedThunks.updateConfigValue({
                    key: "s3",
                    value: fromVault
                })
            );
        },
    changeIsDefault:
        (params: {
            s3ProfileId: string;
            usecase: "defaultXOnyxia" | "explorer";
            value: boolean;
        }) =>
        async (...args) => {
            const { s3ProfileId, usecase, value } = params;

            const [dispatch, getState] = args;

            const fromVault = structuredClone(
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
                const s3ProfileId_currentDefault = fromVault[propertyName];

                if (value) {
                    if (s3ProfileId_currentDefault === s3ProfileId) {
                        return;
                    }
                } else {
                    if (s3ProfileId_currentDefault !== s3ProfileId) {
                        return;
                    }
                }
            }

            fromVault[propertyName] = value ? s3ProfileId : undefined;

            await dispatch(
                projectManagement.protectedThunks.updateConfigValue({
                    key: "s3",
                    value: fromVault
                })
            );
        }
} satisfies Thunks;

export const protectedThunks = {
    getS3ClientForSpecificConfig:
        (params: { s3ProfileId: string | undefined }) =>
        async (...args): Promise<S3Client> => {
            const { s3ProfileId } = params;
            const [, getState, rootContext] = args;

            const { prS3ClientByConfigId: prS3ClientByProfileId } =
                getContext(rootContext);

            const s3Profile = (() => {
                const s3Profiles = selectors.s3Profiles(getState());

                const s3Config = s3Profiles.find(
                    s3Profile => s3Profile.id === s3ProfileId
                );
                assert(s3Config !== undefined);

                return s3Config;
            })();

            use_cached_s3Client: {
                const prS3Client = prS3ClientByProfileId.get(s3Profile.id);

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
                    s3Profile.paramsOfCreateS3Client,
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
                                const resolvedTemplatedBookmarks =
                                    protectedSelectors.resolvedTemplatedBookmarks(
                                        getState()
                                    );

                                const KEY = "onyxia:s3:resolvedAdminBookmarks-hash";

                                const hash = fnv1aHashToHex(
                                    JSON.stringify(resolvedTemplatedBookmarks)
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

            prS3ClientByProfileId.set(s3Profile.id, prS3Client);

            return prS3Client;
        },
    getS3ConfigAndClientForExplorer:
        () =>
        async (
            ...args
        ): Promise<undefined | { s3Client: S3Client; s3Profile: S3Profile }> => {
            const [dispatch, getState] = args;

            const s3Profile = selectors
                .s3Profiles(getState())
                .find(s3Profile => s3Profile.isExplorerConfig);

            if (s3Profile === undefined) {
                return undefined;
            }

            const s3Client = await dispatch(
                protectedThunks.getS3ClientForSpecificConfig({
                    s3ProfileId: s3Profile.id
                })
            );

            return { s3Client, s3Profile };
        },
    createOrUpdateS3Profile:
        (params: { s3Config_vault: projectManagement.ProjectConfigs.S3Config }) =>
        async (...args) => {
            const { s3Config_vault: s3Config_vault } = params;

            const [dispatch, getState] = args;

            const fromVault = structuredClone(
                projectManagement.protectedSelectors.projectConfig(getState()).s3
            );

            const i = fromVault.s3Configs.findIndex(
                projectS3Config_i =>
                    projectS3Config_i.creationTime === s3Config_vault.creationTime
            );

            if (i < 0) {
                fromVault.s3Configs.push(s3Config_vault);
            } else {
                fromVault.s3Configs[i] = s3Config_vault;
            }

            await dispatch(
                projectManagement.protectedThunks.updateConfigValue({
                    key: "s3",
                    value: fromVault
                })
            );
        },

    initialize:
        () =>
        async (...args) => {
            const [dispatch, getState, { onyxiaApi, paramsOfBootstrapCore }] = args;

            const deploymentRegion =
                deploymentRegionManagement.selectors.currentDeploymentRegion(getState());

            const resolvedTemplatedBookmarks = await Promise.all(
                deploymentRegion._s3Next.s3Profiles.map(
                    async (s3Config, s3ConfigIndex) => {
                        const {
                            bookmarks,
                            sts: { oidcParams: oidcParams_partial }
                        } = s3Config;

                        const getDecodedIdToken = async () => {
                            const { createOidc, mergeOidcParams } = await import(
                                "core/adapters/oidc"
                            );

                            const { oidcParams } =
                                await onyxiaApi.getAvailableRegionsAndOidcParams();

                            assert(oidcParams !== undefined);

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
                        };

                        return {
                            correspondingS3ConfigIndexInRegion: s3ConfigIndex,
                            bookmarks: (
                                await Promise.all(
                                    bookmarks.map(bookmark =>
                                        resolveTemplatedBookmark({
                                            bookmark_region: bookmark,
                                            getDecodedIdToken
                                        })
                                    )
                                )
                            ).flat()
                        };
                    }
                )
            );

            dispatch(actions.initialized({ resolvedTemplatedBookmarks }));
        }
} satisfies Thunks;

const { getContext } = createUsecaseContextApi(() => ({
    prS3ClientByConfigId: new Map<string, Promise<S3Client>>()
}));
