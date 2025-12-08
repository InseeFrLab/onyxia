import * as projectManagement from "core/usecases/projectManagement";
import type { DeploymentRegion } from "core/ports/OnyxiaApi/DeploymentRegion";
import type { ParamsOfCreateS3Client } from "core/adapters/s3Client";
import { fnv1aHashToHex } from "core/tools/fnv1aHashToHex";
import { assert, type Equals } from "tsafe";
import type { LocalizedString } from "core/ports/OnyxiaApi";
import type { ResolvedTemplateBookmark } from "./resolveTemplatedBookmark";
import type { ResolvedTemplateStsRole } from "./resolveTemplatedStsRole";
import type { S3UriPrefixObj } from "core/tools/S3Uri";
import { parseUserConfigsS3BookmarksStr } from "./userConfigsS3Bookmarks";

export type S3Profile = S3Profile.DefinedInRegion | S3Profile.CreatedByUser;

export namespace S3Profile {
    type Common = {
        id: string;
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
        friendlyName: string;
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
        resolvedTemplatedBookmarks: {
            correspondingS3ConfigIndexInRegion: number;
            bookmarks: ResolvedTemplateBookmark[];
        }[];
        resolvedTemplatedStsRoles: {
            correspondingS3ConfigIndexInRegion: number;
            stsRoles: ResolvedTemplateStsRole[];
        }[];
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
                    creationTime: c.creationTime,
                    friendlyName: c.friendlyName,
                    id: `${c.creationTime}`,
                    paramsOfCreateS3Client,
                    isXOnyxiaDefault: false,
                    isExplorerConfig: false,
                    // TODO: Actually store custom bookmarks
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
                        role: resolvedTemplatedStsRole,
                        nameOfBucketToCreateIfNotExist: undefined
                    };

                    const id = `region-${fnv1aHashToHex(
                        JSON.stringify([c.url, c.sts.oidcParams.clientId ?? ""])
                    )}`;

                    return {
                        origin: "defined in region",
                        id,
                        bookmarks: [
                            ...resolvedTemplatedBookmarks_forThisProfile
                                .filter(({ forStsRoleSessionNames }) => {
                                    if (forStsRoleSessionNames.length === 0) {
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

                                    return forStsRoleSessionNames.some(
                                        stsRoleSessionName =>
                                            getDoMatch({
                                                stringWithWildcards: stsRoleSessionName,
                                                candidate:
                                                    resolvedTemplatedStsRole.roleSessionName
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
                                .filter(entry => entry.s3ProfileId === id)
                                .map(entry => ({
                                    isReadonly: false,
                                    displayName: entry.displayName,
                                    s3UriPrefixObj: entry.s3UriPrefixObj
                                }))
                        ],
                        paramsOfCreateS3Client,
                        isXOnyxiaDefault: false,
                        isExplorerConfig: false
                    };
                };

                const resolvedTemplatedStsRoles_forThisProfile = (() => {
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

    (
        [
            ["defaultXOnyxia", fromVault.projectConfigs_s3.s3ConfigId_defaultXOnyxia],
            ["explorer", fromVault.projectConfigs_s3.s3ConfigId_explorer]
        ] as const
    ).forEach(([prop, s3ProfileId]) => {
        if (s3ProfileId === undefined) {
            return;
        }

        const s3Profile =
            s3Profiles.find(({ id }) => id === s3ProfileId) ??
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
