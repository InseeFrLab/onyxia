import * as projectManagement from "core/usecases/projectManagement";
import type { S3Config } from "core/ports/OnyxiaApi/S3Config";
import type { ParamsOfCreateS3Client } from "core/adapters/s3Client";
import { assert, id } from "tsafe";
import type { LocalizedString } from "core/ports/OnyxiaApi";
import { resolveTemplatedBookmark } from "./resolveTemplatedBookmark";
import { resolveTemplatedStsRole, type StsRole } from "./resolveTemplatedStsRole";
import type { S3Uri } from "core/tools/S3Uri";
import { parseUserConfigsS3BookmarksStr } from "./userConfigsS3Bookmarks";
import type { OidcParams_Partial } from "core/ports/OnyxiaApi/OidcParams";
import { parseS3Uri } from "core/tools/S3Uri";
import { same } from "evt/tools/inDepth/same";

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

export function createS3Profiles(params: {
    onyxiaInstanceS3ConfigEntries: S3Config.Entry[];
    persistenceLayerData: {
        s3Profiles: projectManagement.ProjectConfigs.S3Profile[];
        userConfigs_s3BookmarksStr: string | null;
    };
    decodedIdTokens: {
        oidcParams: OidcParams_Partial;
        decodedIdToken: Record<string, unknown>;
    }[];
}): S3Profile[] {
    const { onyxiaInstanceS3ConfigEntries, persistenceLayerData, decodedIdTokens } =
        params;

    const bookmarks_user: {
        displayName: string | undefined;
        s3Uri: S3Uri;
        profileName: string;
    }[] =
        persistenceLayerData.userConfigs_s3BookmarksStr === null
            ? []
            : parseUserConfigsS3BookmarksStr({
                  userConfigs_s3BookmarksStr:
                      persistenceLayerData.userConfigs_s3BookmarksStr
              });

    const s3Profiles: S3Profile[] = [
        ...persistenceLayerData.s3Profiles
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
        ...onyxiaInstanceS3ConfigEntries
            .map((c): S3Profile.DefinedInRegion[] => {
                const decodedIdToken = (() => {
                    const wrap = decodedIdTokens.find(wrap =>
                        same(wrap.oidcParams, c.sts.oidcParams)
                    );

                    assert(wrap !== undefined);

                    return wrap.decodedIdToken;
                })();

                const bookmarks_admin: {
                    title: LocalizedString;
                    s3Uri: S3Uri;
                    forProfileNames: string[];
                }[] = c.bookmarks
                    .map(bookmark_fromConfig => {
                        if (!bookmark_fromConfig.isTemplated) {
                            return [
                                {
                                    s3Uri: parseS3Uri({
                                        value: bookmark_fromConfig.s3UriStr,
                                        delimiter: "/"
                                    }),
                                    title: bookmark_fromConfig.title,
                                    forProfileNames: bookmark_fromConfig.forProfileNames
                                }
                            ];
                        }

                        const bookmarks = resolveTemplatedBookmark({
                            bookmark_fromConfig,
                            decodedIdToken
                        });

                        return bookmarks;
                    })
                    .flat();

                const getBookmarksForProfileName = (params: {
                    profileName: string;
                }): S3Profile.Bookmark[] => {
                    const { profileName } = params;
                    return [
                        ...bookmarks_admin
                            .filter(({ forProfileNames }) => {
                                if (forProfileNames.length === 0) {
                                    return true;
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

                                return forProfileNames.some(profileName_withWildcards =>
                                    getDoMatch({
                                        stringWithWildcards: profileName_withWildcards,
                                        candidate: profileName
                                    })
                                );
                            })
                            .map(({ title, s3Uri }) => ({
                                isReadonly: true,
                                displayName: title,
                                s3Uri
                            })),
                        ...bookmarks_user
                            .filter(bookmark => bookmark.profileName === profileName)
                            .map(bookmark => ({
                                isReadonly: false,
                                displayName: bookmark.displayName || undefined,
                                s3Uri: bookmark.s3Uri
                            }))
                    ];
                };

                const buildFromRole = (params: {
                    stsRole: StsRole;
                }): S3Profile.DefinedInRegion => {
                    const { stsRole } = params;

                    const paramsOfCreateS3Client: ParamsOfCreateS3Client.Sts = {
                        url: c.url,
                        pathStyleAccess: c.pathStyleAccess,
                        isStsEnabled: true,
                        stsUrl: c.sts.url,
                        region: c.region,
                        oidcParams: c.sts.oidcParams,
                        durationSeconds: c.sts.durationSeconds,
                        role: stsRole
                    };

                    const { profileName } = stsRole;

                    return {
                        origin: "onyxia instance config",
                        profileName,
                        bookmarks: getBookmarksForProfileName({ profileName }),
                        paramsOfCreateS3Client
                    };
                };

                const stsRoles: StsRole[] = c.sts.roles
                    .map(stsRole_fromConfig => {
                        if (!stsRole_fromConfig.isTemplated) {
                            return [
                                {
                                    roleARN: stsRole_fromConfig.roleARN,
                                    roleSessionName: stsRole_fromConfig.roleSessionName,
                                    profileName: stsRole_fromConfig.profileName
                                }
                            ];
                        }

                        const stsRoles = resolveTemplatedStsRole({
                            stsRole_fromConfig: stsRole_fromConfig,
                            decodedIdToken
                        });

                        return stsRoles;
                    })
                    .flat();

                const s3Profiles: S3Profile.DefinedInRegion[] = stsRoles.map(stsRole =>
                    buildFromRole({ stsRole })
                );

                if (c.anonymousProfileName !== undefined) {
                    const profileName = c.anonymousProfileName;

                    s3Profiles.push(
                        id<S3Profile.DefinedInRegion>({
                            origin: "onyxia instance config",
                            bookmarks: getBookmarksForProfileName({ profileName }),
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
