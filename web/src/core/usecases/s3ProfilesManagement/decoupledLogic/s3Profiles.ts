import * as projectManagement from "core/usecases/projectManagement";
import type { S3Config } from "core/ports/OnyxiaApi/S3Config";
import type { ParamsOfCreateS3Client } from "core/adapters/s3Client";
import { assert, id } from "tsafe";
import type { LocalizedString } from "core/ports/OnyxiaApi";
import type { ResolvedTemplateBookmark } from "./resolveTemplatedBookmark";
import type { ResolvedTemplateStsRole } from "./resolveTemplatedStsRole";
import type { S3Uri } from "core/tools/S3Uri";
import { parseUserConfigsS3BookmarksStr } from "./userConfigsS3Bookmarks";

export type S3Profile = S3Profile.DefinedInRegion | S3Profile.CreatedByUser;

export namespace S3Profile {
    type Common = {
        profileName: string;
        bookmarks: Bookmark[];
    };

    export type DefinedInRegion = Common & {
        origin: "onyxia instance config";
        paramsOfCreateS3Client: ParamsOfCreateS3Client;
    };

    export type CreatedByUser = Common & {
        origin: "created by user (or group project member)";
        creationTime: number;
        paramsOfCreateS3Client: ParamsOfCreateS3Client.NoSts;
    };

    export type Bookmark = {
        isReadonly: boolean;
        displayName: LocalizedString | undefined;
        s3Uri: S3Uri;
    };
}

export function aggregateS3ProfilesFromVaultAndRegionIntoAnUnifiedSet(params: {
    fromVault: {
        s3Profiles: projectManagement.ProjectConfigs.S3Profile[];
        userConfigs_s3BookmarksStr: string | null;
    };
    fromConfig: {
        entries: S3Config.Entry[];
        // NOTE: The resolvedXXX can be undefined only when the function is used to
        // the stablish the default profiles (for explorer and services)
        resolvedTemplatedBookmarks:
            | {
                  correspondingS3ConfigEntryIndex: number;
                  bookmarks: ResolvedTemplateBookmark[];
              }[]
            | undefined;
        resolvedTemplatedStsRoles:
            | {
                  correspondingS3ConfigEntryIndex: number;
                  stsRoles: ResolvedTemplateStsRole[];
              }[]
            | undefined;
    };
}): S3Profile[] {
    const { fromVault, fromConfig } = params;

    const s3Profiles: S3Profile[] = [
        ...fromVault.s3Profiles
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
                    profileName: c.profileName,
                    creationTime: c.creationTime,
                    paramsOfCreateS3Client,
                    bookmarks: (c.bookmarks ?? []).map(({ displayName, s3Uri }) => ({
                        displayName,
                        s3Uri,
                        isReadonly: false
                    }))
                };
            })
            .sort((a, b) => b.creationTime - a.creationTime),
        ...fromConfig.entries
            .map((c, index): S3Profile.DefinedInRegion[] => {
                const resolvedTemplatedBookmarks_forThisProfile = (() => {
                    if (fromConfig.resolvedTemplatedBookmarks === undefined) {
                        return [];
                    }

                    const entry = fromConfig.resolvedTemplatedBookmarks.find(
                        e => e.correspondingS3ConfigEntryIndex === index
                    );

                    assert(entry !== undefined);

                    return entry.bookmarks;
                })();

                const userConfigs_s3Bookmarks = parseUserConfigsS3BookmarksStr({
                    userConfigs_s3BookmarksStr: fromVault.userConfigs_s3BookmarksStr
                });

                const buildFromRole = (params: {
                    resolvedTemplatedStsRole: ResolvedTemplateStsRole;
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

                    return {
                        origin: "onyxia instance config",
                        profileName: resolvedTemplatedStsRole.profileName,
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
                                .map(({ title, s3Uri }) => ({
                                    isReadonly: true,
                                    displayName: title,
                                    s3Uri
                                })),
                            ...userConfigs_s3Bookmarks
                                .filter(
                                    entry =>
                                        entry.profileName ===
                                        resolvedTemplatedStsRole.profileName
                                )
                                .map(entry => ({
                                    isReadonly: false,
                                    displayName: entry.displayName ?? undefined,
                                    s3Uri: entry.s3Uri
                                }))
                        ],
                        paramsOfCreateS3Client
                    };
                };

                const resolvedTemplatedStsRoles_forThisProfile = (() => {
                    if (fromConfig.resolvedTemplatedStsRoles === undefined) {
                        return [];
                    }

                    const entry = fromConfig.resolvedTemplatedStsRoles.find(
                        e => e.correspondingS3ConfigEntryIndex === index
                    );

                    assert(entry !== undefined);

                    return entry.stsRoles;
                })();

                const s3Profiles = resolvedTemplatedStsRoles_forThisProfile.map(
                    resolvedTemplatedStsRole =>
                        buildFromRole({ resolvedTemplatedStsRole })
                );

                if (c.anonymousProfileName !== undefined) {
                    const profileName = c.anonymousProfileName;

                    s3Profiles.push(
                        id<S3Profile.DefinedInRegion>({
                            origin: "onyxia instance config",
                            bookmarks: userConfigs_s3Bookmarks
                                .filter(entry => entry.profileName === profileName)
                                .map(entry => ({
                                    isReadonly: false,
                                    displayName: entry.displayName ?? undefined,
                                    s3Uri: entry.s3Uri
                                })),
                            profileName,
                            paramsOfCreateS3Client: id<ParamsOfCreateS3Client.NoSts>({
                                url: c.url,
                                isStsEnabled: false,
                                credentials: undefined,
                                pathStyleAccess: c.pathStyleAccess,
                                region: c.region
                            })
                        })
                    );
                }

                return s3Profiles;
            })
            .flat()
    ];

    for (const s3Profile of [...s3Profiles].sort((a, b) => {
        if (a.origin === b.origin) {
            return 0;
        }

        return a.origin === "onyxia instance config" ? -1 : 1;
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

    return s3Profiles;
}
