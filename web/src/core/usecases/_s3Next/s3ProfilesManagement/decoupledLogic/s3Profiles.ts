import * as projectManagement from "core/usecases/projectManagement";
import type { DeploymentRegion } from "core/ports/OnyxiaApi/DeploymentRegion";
import type { ParamsOfCreateS3Client } from "core/adapters/s3Client";
import { assert, type Equals } from "tsafe";
import type { LocalizedString } from "core/ports/OnyxiaApi";
import type { ResolvedTemplateBookmark } from "./resolveTemplatedBookmark";
import type { ResolvedTemplateStsRole } from "./resolveTemplatedStsRole";
import type { S3UriPrefixObj } from "core/tools/S3Uri";
import { parseUserConfigsS3BookmarksStr } from "./userConfigsS3Bookmarks";

export type S3Profile = S3Profile.DefinedInRegion | S3Profile.CreatedByUser;

export namespace S3Profile {
    type Common = {
        profileName: string;
        isXOnyxiaDefault: boolean;
        isExplorerConfig: boolean;
        bookmarks: Bookmark[];
    };

    export type DefinedInRegion = Common & {
        origin: "defined in region";
        paramsOfCreateS3Client: ParamsOfCreateS3Client.Sts;
    };

    export type CreatedByUser = Common & {
        origin: "created by user (or group project member)";
        creationTime: number;
        paramsOfCreateS3Client: ParamsOfCreateS3Client.NoSts;
    };

    export type Bookmark = {
        isReadonly: boolean;
        displayName: LocalizedString | undefined;
        s3UriPrefixObj: S3UriPrefixObj;
    };
}

export function aggregateS3ProfilesFromVaultAndRegionIntoAnUnifiedSet(params: {
    fromVault: {
        projectConfigs_s3: projectManagement.ProjectConfigs["s3"];
        userConfigs_s3BookmarksStr: string | null;
    };
    fromRegion: {
        s3Profiles: DeploymentRegion.S3Next.S3Profile[];
        // NOTE: The resolvedXXX can be undefined only when the function is used to
        // the stablish the default profiles (for explorer and services)
        resolvedTemplatedBookmarks:
            | {
                  correspondingS3ConfigIndexInRegion: number;
                  bookmarks: ResolvedTemplateBookmark[];
              }[]
            | undefined;
        resolvedTemplatedStsRoles:
            | {
                  correspondingS3ConfigIndexInRegion: number;
                  stsRoles: ResolvedTemplateStsRole[];
              }[]
            | undefined;
    };
}): S3Profile[] {
    const { fromVault, fromRegion } = params;

    const s3Profiles: S3Profile[] = [
        ...fromVault.projectConfigs_s3.s3Configs
            .map((c): S3Profile.CreatedByUser => {
                const url = c.url;
                const pathStyleAccess = c.pathStyleAccess;
                const region = c.region;

                const paramsOfCreateS3Client: ParamsOfCreateS3Client.NoSts = {
                    url,
                    pathStyleAccess,
                    isStsEnabled: false,
                    region,
                    credentials: c.credentials
                };

                return {
                    origin: "created by user (or group project member)",
                    profileName: c.friendlyName,
                    creationTime: c.creationTime,
                    paramsOfCreateS3Client,
                    isXOnyxiaDefault: false,
                    isExplorerConfig: false,
                    bookmarks: (c.bookmarks ?? []).map(
                        ({ displayName, s3UriPrefixObj }) => ({
                            displayName,
                            s3UriPrefixObj,
                            isReadonly: false
                        })
                    )
                };
            })
            .sort((a, b) => b.creationTime - a.creationTime),
        ...fromRegion.s3Profiles
            .map((c, index): S3Profile.DefinedInRegion[] => {
                const resolvedTemplatedBookmarks_forThisProfile = (() => {
                    if (fromRegion.resolvedTemplatedBookmarks === undefined) {
                        return [];
                    }

                    const entry = fromRegion.resolvedTemplatedBookmarks.find(
                        e => e.correspondingS3ConfigIndexInRegion === index
                    );

                    assert(entry !== undefined);

                    return entry.bookmarks;
                })();

                const buildFromRole = (params: {
                    resolvedTemplatedStsRole: ResolvedTemplateStsRole | undefined;
                }): S3Profile.DefinedInRegion => {
                    const { resolvedTemplatedStsRole } = params;

                    const paramsOfCreateS3Client: ParamsOfCreateS3Client.Sts = {
                        url: c.url,
                        pathStyleAccess: c.pathStyleAccess,
                        isStsEnabled: true,
                        stsUrl: c.sts.url,
                        region: c.region,
                        oidcParams: c.sts.oidcParams,
                        durationSeconds: c.sts.durationSeconds,
                        role: resolvedTemplatedStsRole
                    };

                    const profileName = (() => {
                        if (resolvedTemplatedStsRole === undefined) {
                            assert(c.profileName !== undefined);
                            return c.profileName;
                        }

                        return resolvedTemplatedStsRole.profileName;
                    })();

                    return {
                        origin: "defined in region",
                        profileName,
                        bookmarks: [
                            ...resolvedTemplatedBookmarks_forThisProfile
                                .filter(({ forProfileNames }) => {
                                    if (forProfileNames.length === 0) {
                                        return true;
                                    }

                                    if (resolvedTemplatedStsRole === undefined) {
                                        return false;
                                    }

                                    const getDoMatch = (params: {
                                        stringWithWildcards: string;
                                        candidate: string;
                                    }): boolean => {
                                        const { stringWithWildcards, candidate } = params;

                                        if (!stringWithWildcards.includes("*")) {
                                            return stringWithWildcards === candidate;
                                        }

                                        const escapedRegex = stringWithWildcards
                                            .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
                                            .replace(/\\\*/g, ".*");

                                        return new RegExp(`^${escapedRegex}$`).test(
                                            candidate
                                        );
                                    };

                                    return forProfileNames.some(profileName =>
                                        getDoMatch({
                                            stringWithWildcards: profileName,
                                            candidate:
                                                resolvedTemplatedStsRole.profileName
                                        })
                                    );
                                })
                                .map(({ title, s3UriPrefixObj }) => ({
                                    isReadonly: true,
                                    displayName: title,
                                    s3UriPrefixObj
                                })),
                            ...parseUserConfigsS3BookmarksStr({
                                userConfigs_s3BookmarksStr:
                                    fromVault.userConfigs_s3BookmarksStr
                            })
                                .filter(entry => entry.profileName === profileName)
                                .map(entry => ({
                                    isReadonly: false,
                                    displayName: entry.displayName ?? undefined,
                                    s3UriPrefixObj: entry.s3UriPrefixObj
                                }))
                        ],
                        paramsOfCreateS3Client,
                        isXOnyxiaDefault: false,
                        isExplorerConfig: false
                    };
                };

                const resolvedTemplatedStsRoles_forThisProfile = (() => {
                    if (fromRegion.resolvedTemplatedStsRoles === undefined) {
                        return [];
                    }

                    const entry = fromRegion.resolvedTemplatedStsRoles.find(
                        e => e.correspondingS3ConfigIndexInRegion === index
                    );

                    assert(entry !== undefined);

                    return entry.stsRoles;
                })();

                if (resolvedTemplatedStsRoles_forThisProfile.length === 0) {
                    return [buildFromRole({ resolvedTemplatedStsRole: undefined })];
                }

                return resolvedTemplatedStsRoles_forThisProfile.map(
                    resolvedTemplatedStsRole =>
                        buildFromRole({ resolvedTemplatedStsRole })
                );
            })
            .flat()
    ];

    for (const s3Profile of [...s3Profiles].sort((a, b) => {
        if (a.origin === b.origin) {
            return 0;
        }

        return a.origin === "defined in region" ? -1 : 1;
    })) {
        const s3Profiles_conflicting = s3Profiles.filter(
            s3Profile_i =>
                s3Profile_i !== s3Profile &&
                s3Profile_i.profileName === s3Profile.profileName
        );

        if (s3Profiles_conflicting.length === 0) {
            continue;
        }

        console.warn(`The is more than one s3Profile named: ${s3Profile.profileName}`);

        for (const s3Profile_conflicting of s3Profiles_conflicting) {
            const i = s3Profiles.indexOf(s3Profile_conflicting);

            s3Profiles.splice(i, 1);
        }
    }

    (
        [
            ["defaultXOnyxia", fromVault.projectConfigs_s3.s3ConfigId_defaultXOnyxia],
            ["explorer", fromVault.projectConfigs_s3.s3ConfigId_explorer]
        ] as const
    ).forEach(([prop, profileName]) => {
        if (profileName === undefined) {
            return;
        }

        const s3Profile =
            s3Profiles.find(s3Profile => s3Profile.profileName === profileName) ??
            s3Profiles.find(s3Config => s3Config.origin === "defined in region");

        if (s3Profile === undefined) {
            return;
        }

        switch (prop) {
            case "defaultXOnyxia":
                s3Profile.isXOnyxiaDefault = true;
                return;
            case "explorer":
                s3Profile.isExplorerConfig = true;
                return;
            default:
                assert<Equals<typeof prop, never>>(false);
        }
    });

    return s3Profiles;
}
