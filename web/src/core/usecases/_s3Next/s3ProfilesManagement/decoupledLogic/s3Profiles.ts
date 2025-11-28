import * as projectManagement from "core/usecases/projectManagement";
import type { DeploymentRegion } from "core/ports/OnyxiaApi/DeploymentRegion";
import type { ParamsOfCreateS3Client } from "core/adapters/s3Client";
import { same } from "evt/tools/inDepth/same";
import { fnv1aHashToHex } from "core/tools/fnv1aHashToHex";
import { assert, type Equals } from "tsafe";
import type * as s3CredentialsTest from "core/usecases/_s3Next/s3CredentialsTest";
import type { LocalizedString } from "core/ports/OnyxiaApi";
import type { ResolvedTemplateBookmark } from "./resolveTemplatedBookmark";
import type { ResolvedTemplateStsRole } from "./resolveTemplatedStsRole";
import type { S3UriPrefixObj } from "core/tools/S3Uri";

export type S3Profile = S3Profile.DefinedInRegion | S3Profile.CreatedByUser;

export namespace S3Profile {
    type Common = {
        id: string;
        isXOnyxiaDefault: boolean;
        isExplorerConfig: boolean;
        credentialsTestStatus:
            | { status: "not tested" }
            | { status: "test ongoing" }
            | { status: "test failed"; errorMessage: string }
            | { status: "test succeeded" };
    };

    export type DefinedInRegion = Common & {
        origin: "defined in region";
        paramsOfCreateS3Client: ParamsOfCreateS3Client.Sts;
        bookmarks: Bookmark[];
    };

    export type CreatedByUser = Common & {
        origin: "created by user (or group project member)";
        creationTime: number;
        paramsOfCreateS3Client: ParamsOfCreateS3Client.NoSts;
        friendlyName: string;
        bookmarks: Bookmark[];
    };

    export type Bookmark = {
        displayName: LocalizedString | undefined;
        s3UriPrefixObj: S3UriPrefixObj;
    };
}

export function aggregateS3ProfilesFromVaultAndRegionIntoAnUnifiedSet(params: {
    fromVault: projectManagement.ProjectConfigs["s3"];
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
    credentialsTestState: s3CredentialsTest.State;
}): S3Profile[] {
    const { fromVault, fromRegion, credentialsTestState } = params;

    const getCredentialsTestStatus = (params: {
        paramsOfCreateS3Client: ParamsOfCreateS3Client;
    }): S3Profile["credentialsTestStatus"] => {
        const { paramsOfCreateS3Client } = params;

        if (
            credentialsTestState.ongoingTests.find(e =>
                same(e.paramsOfCreateS3Client, paramsOfCreateS3Client)
            ) !== undefined
        ) {
            return { status: "test ongoing" };
        }

        has_result: {
            const { result } =
                credentialsTestState.testResults.find(e =>
                    same(e.paramsOfCreateS3Client, paramsOfCreateS3Client)
                ) ?? {};

            if (result === undefined) {
                break has_result;
            }

            return result.isSuccess
                ? { status: "test succeeded" }
                : { status: "test failed", errorMessage: result.errorMessage };
        }

        return { status: "not tested" };
    };

    const s3Profiles: S3Profile[] = [
        ...fromVault.s3Configs
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
                    bookmarks: [],
                    credentialsTestStatus: getCredentialsTestStatus({
                        paramsOfCreateS3Client
                    })
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

                    return {
                        origin: "defined in region",
                        id: `region-${fnv1aHashToHex(
                            JSON.stringify([c.url, c.sts.oidcParams.clientId ?? ""])
                        )}`,
                        bookmarks: resolvedTemplatedBookmarks_forThisProfile
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

                                return forStsRoleSessionNames.some(stsRoleSessionName =>
                                    getDoMatch({
                                        stringWithWildcards: stsRoleSessionName,
                                        candidate:
                                            resolvedTemplatedStsRole.roleSessionName
                                    })
                                );
                            })
                            .map(({ title, s3UriPrefixObj }) => ({
                                displayName: title,
                                s3UriPrefixObj
                            })),
                        paramsOfCreateS3Client,
                        credentialsTestStatus: getCredentialsTestStatus({
                            paramsOfCreateS3Client
                        }),
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
            ["defaultXOnyxia", fromVault.s3ConfigId_defaultXOnyxia],
            ["explorer", fromVault.s3ConfigId_explorer]
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
