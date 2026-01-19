import type { Thunks } from "core/bootstrap";
import { selectors, protectedSelectors } from "./selectors";
import * as projectManagement from "core/usecases/projectManagement";
import { assert } from "tsafe/assert";
import type { S3Client } from "core/ports/S3Client";
import { updateDefaultS3ProfilesAfterPotentialDeletion } from "./decoupledLogic/updateDefaultS3ProfilesAfterPotentialDeletion";
import structuredClone from "@ungap/structured-clone";
import * as deploymentRegionManagement from "core/usecases/deploymentRegionManagement";
import { fnv1aHashToHex } from "core/tools/fnv1aHashToHex";
import { resolveTemplatedBookmark } from "./decoupledLogic/resolveTemplatedBookmark";
import { resolveTemplatedStsRole } from "./decoupledLogic/resolveTemplatedStsRole";
import { actions } from "./state";
import type { S3Profile } from "./decoupledLogic/s3Profiles";
import type { OidcParams_Partial } from "core/ports/OnyxiaApi/OidcParams";
import type { S3UriPrefixObj } from "core/tools/S3Uri";
import { same } from "evt/tools/inDepth/same";
import {
    parseUserConfigsS3BookmarksStr,
    serializeUserConfigsS3Bookmarks
} from "./decoupledLogic/userConfigsS3Bookmarks";
import * as userConfigs from "core/usecases/userConfigs";

export const thunks = {
    deleteS3Profile:
        (params: { profileName: string }) =>
        async (...args) => {
            const { profileName } = params;

            const [dispatch, getState] = args;

            const projectConfigs_s3 = structuredClone(
                projectManagement.protectedSelectors.projectConfig(getState()).s3
            );

            const i = projectConfigs_s3.s3Configs.findIndex(
                s3Profile => s3Profile.friendlyName === profileName
            );

            assert(i !== -1);

            projectConfigs_s3.s3Configs.splice(i, 1);

            {
                const actions = updateDefaultS3ProfilesAfterPotentialDeletion({
                    fromRegion: {
                        s3Profiles:
                            deploymentRegionManagement.selectors.currentDeploymentRegion(
                                getState()
                            )._s3Next.s3Profiles
                    },
                    fromVault: {
                        projectConfigs_s3
                    }
                });

                for (const propertyName of [
                    "profileName_defaultXOnyxia",
                    "profileName_explorer"
                ] as const) {
                    const action = actions[propertyName];

                    if (!action.isUpdateNeeded) {
                        continue;
                    }

                    projectConfigs_s3[
                        (() => {
                            switch (propertyName) {
                                case "profileName_defaultXOnyxia":
                                    return "s3ConfigId_defaultXOnyxia";
                                case "profileName_explorer":
                                    return "s3ConfigId_explorer";
                            }
                        })()
                    ] = action.profileName;
                }
            }

            await dispatch(
                projectManagement.protectedThunks.updateConfigValue({
                    key: "s3",
                    value: projectConfigs_s3
                })
            );
        }
} satisfies Thunks;

const globalContext = {
    prS3ClientByProfileName: new Map<string, Promise<S3Client>>()
};

export const protectedThunks = {
    getS3Client:
        (params: { profileName: string }) =>
        async (...args): Promise<S3Client> => {
            const { profileName } = params;
            const [, getState, rootContext] = args;

            const s3Profile = (() => {
                const s3Profiles = selectors.s3Profiles(getState());

                const s3Config = s3Profiles.find(
                    s3Profile => s3Profile.profileName === profileName
                );
                assert(s3Config !== undefined);

                return s3Config;
            })();

            use_cached_s3Client: {
                const prS3Client = globalContext.prS3ClientByProfileName.get(
                    s3Profile.profileName
                );

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

            globalContext.prS3ClientByProfileName.set(s3Profile.profileName, prS3Client);

            return prS3Client;
        },
    getS3ProfileAndClientForExplorer:
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
                protectedThunks.getS3Client({
                    profileName: s3Profile.profileName
                })
            );

            return { s3Client, s3Profile };
        },
    createOrUpdateS3Profile:
        (params: { s3Config_vault: projectManagement.ProjectConfigs.S3Config }) =>
        async (...args) => {
            const { s3Config_vault } = params;

            const [dispatch, getState] = args;

            const fromVault = structuredClone(
                projectManagement.protectedSelectors.projectConfig(getState()).s3
            );

            const i = fromVault.s3Configs.findIndex(
                projectS3Config_i =>
                    projectS3Config_i.creationTime === s3Config_vault.creationTime
            );

            update_default_selected: {
                if (i === -1) {
                    break update_default_selected;
                }

                const s3Config_vault_current = fromVault.s3Configs[i];

                if (s3Config_vault.friendlyName === s3Config_vault.friendlyName) {
                    break update_default_selected;
                }

                for (const propertyName of [
                    "s3ConfigId_defaultXOnyxia",
                    "s3ConfigId_explorer"
                ] as const) {
                    if (fromVault[propertyName] === s3Config_vault_current.friendlyName) {
                        fromVault[propertyName] = s3Config_vault.friendlyName;
                    }
                }
            }

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
    createDeleteOrUpdateBookmark:
        (params: {
            profileName: string;
            s3UriPrefixObj: S3UriPrefixObj;
            action:
                | {
                      type: "create or update";
                      displayName: string | undefined;
                  }
                | {
                      type: "delete";
                  };
        }) =>
        async (...args) => {
            const { profileName, s3UriPrefixObj, action } = params;

            const [dispatch, getState] = args;

            const s3Profiles = selectors.s3Profiles(getState());

            const s3Profile = s3Profiles.find(
                s3Profile => s3Profile.profileName === profileName
            );

            assert(s3Profile !== undefined);

            switch (s3Profile.origin) {
                case "created by user (or group project member)":
                    {
                        const projectConfigs_s3 = structuredClone(
                            projectManagement.protectedSelectors.projectConfig(getState())
                                .s3
                        );

                        const s3Config_vault = projectConfigs_s3.s3Configs.find(
                            s3Config => s3Config.creationTime === s3Profile.creationTime
                        );

                        assert(s3Config_vault !== undefined);

                        s3Config_vault.bookmarks ??= [];

                        const index = s3Config_vault.bookmarks.findIndex(bookmark =>
                            same(bookmark.s3UriPrefixObj, s3UriPrefixObj)
                        );

                        switch (action.type) {
                            case "create or update":
                                {
                                    const bookmark_new = {
                                        displayName: action.displayName,
                                        s3UriPrefixObj
                                    };

                                    if (index === -1) {
                                        s3Config_vault.bookmarks.push(bookmark_new);
                                    } else {
                                        s3Config_vault.bookmarks[index] = bookmark_new;
                                    }
                                }
                                break;
                            case "delete":
                                {
                                    assert(index !== -1);

                                    s3Config_vault.bookmarks.splice(index, 1);
                                }
                                break;
                        }

                        await dispatch(
                            projectManagement.protectedThunks.updateConfigValue({
                                key: "s3",
                                value: projectConfigs_s3
                            })
                        );
                    }
                    break;
                case "defined in region":
                    {
                        const { s3BookmarksStr } =
                            userConfigs.selectors.userConfigs(getState());

                        const userConfigs_s3Bookmarks = parseUserConfigsS3BookmarksStr({
                            userConfigs_s3BookmarksStr: s3BookmarksStr
                        });

                        const index = userConfigs_s3Bookmarks.findIndex(
                            entry =>
                                entry.profileName === s3Profile.profileName &&
                                same(entry.s3UriPrefixObj, s3UriPrefixObj)
                        );

                        switch (action.type) {
                            case "create or update":
                                {
                                    const bookmark_new = {
                                        profileName: s3Profile.profileName,
                                        displayName: action.displayName ?? null,
                                        s3UriPrefixObj
                                    };

                                    if (index === -1) {
                                        userConfigs_s3Bookmarks.push(bookmark_new);
                                    } else {
                                        userConfigs_s3Bookmarks[index] = bookmark_new;
                                    }
                                }
                                break;
                            case "delete":
                                {
                                    assert(index !== -1);

                                    userConfigs_s3Bookmarks.splice(index, 1);
                                }
                                break;
                        }

                        await dispatch(
                            userConfigs.thunks.changeValue({
                                key: "s3BookmarksStr",
                                value: serializeUserConfigsS3Bookmarks({
                                    userConfigs_s3Bookmarks
                                })
                            })
                        );
                    }
                    break;
            }
        },
    changeIsDefault:
        (params: {
            profileName: string;
            usecase: "defaultXOnyxia" | "explorer";
            value: boolean;
        }) =>
        async (...args) => {
            const { profileName, usecase, value } = params;

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
                    if (s3ProfileId_currentDefault === profileName) {
                        return;
                    }
                } else {
                    if (s3ProfileId_currentDefault !== profileName) {
                        return;
                    }
                }
            }

            fromVault[propertyName] = value ? profileName : undefined;

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

            const getDecodedIdToken = async (params: {
                oidcParams_partial: OidcParams_Partial;
            }) => {
                const { oidcParams_partial } = params;

                const { createOidc, mergeOidcParams } = await import(
                    "core/adapters/oidc"
                );

                const { oidcParams } = await onyxiaApi.getAvailableRegionsAndOidcParams();

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

            const resolvedTemplatedBookmarks = await Promise.all(
                deploymentRegion._s3Next.s3Profiles.map(
                    async (s3Config, s3ConfigIndex) => {
                        const { bookmarks: bookmarks_region, sts } = s3Config;

                        return {
                            correspondingS3ConfigIndexInRegion: s3ConfigIndex,
                            bookmarks: (
                                await Promise.all(
                                    bookmarks_region.map(bookmark =>
                                        resolveTemplatedBookmark({
                                            bookmark_region: bookmark,
                                            getDecodedIdToken: () =>
                                                getDecodedIdToken({
                                                    oidcParams_partial: sts.oidcParams
                                                })
                                        })
                                    )
                                )
                            ).flat()
                        };
                    }
                )
            );

            const resolvedTemplatedStsRoles = await Promise.all(
                deploymentRegion._s3Next.s3Profiles.map(
                    async (s3Config, s3ConfigIndex) => {
                        const { sts } = s3Config;

                        return {
                            correspondingS3ConfigIndexInRegion: s3ConfigIndex,
                            stsRoles: (
                                await Promise.all(
                                    sts.roles.map(stsRole_region =>
                                        resolveTemplatedStsRole({
                                            stsRole_region,
                                            getDecodedIdToken: () =>
                                                getDecodedIdToken({
                                                    oidcParams_partial: sts.oidcParams
                                                })
                                        })
                                    )
                                )
                            ).flat()
                        };
                    }
                )
            );

            dispatch(
                actions.initialized({
                    resolvedTemplatedBookmarks,
                    resolvedTemplatedStsRoles
                })
            );
        }
} satisfies Thunks;
