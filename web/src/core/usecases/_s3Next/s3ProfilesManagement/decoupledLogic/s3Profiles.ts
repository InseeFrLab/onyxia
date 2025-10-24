import * as projectManagement from "core/usecases/projectManagement";
import type { DeploymentRegion } from "core/ports/OnyxiaApi/DeploymentRegion";
import type { ParamsOfCreateS3Client } from "core/adapters/s3Client";
import { same } from "evt/tools/inDepth/same";
import { fnv1aHashToHex } from "core/tools/fnv1aHashToHex";
import { assert, type Equals } from "tsafe";
import type * as s3CredentialsTest from "core/usecases/_s3Next/s3CredentialsTest";
import type { LocalizedString } from "core/ports/OnyxiaApi";

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

    export namespace DefinedInRegion {
        export type Bookmark = {
            title: LocalizedString;
            description: LocalizedString | undefined;
            tags: LocalizedString[];
            bucket: string;
            keyPrefix: string;
        };
    }

    export type CreatedByUser = Common & {
        origin: "created by user (or group project member)";
        creationTime: number;
        paramsOfCreateS3Client: ParamsOfCreateS3Client.NoSts;
        friendlyName: string;
        bookmarks: Bookmark[];
    };

    export type Bookmark = {
        displayName: LocalizedString | undefined;
        bucket: string;
        keyPrefix: string;
    };
}

export function aggregateS3ProfilesFromVaultAndRegionIntoAnUnifiedSet(params: {
    fromVault: projectManagement.ProjectConfigs["s3"];
    fromRegion: (Omit<DeploymentRegion.S3Next.S3Profile, "bookmarks"> & {
        bookmarks: S3Profile.DefinedInRegion.Bookmark[];
    })[];
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
        ...fromRegion.map((c): S3Profile.DefinedInRegion => {
            const url = c.url;
            const pathStyleAccess = c.pathStyleAccess;
            const region = c.region;

            const paramsOfCreateS3Client: ParamsOfCreateS3Client.Sts = {
                url,
                pathStyleAccess,
                isStsEnabled: true,
                stsUrl: c.sts.url,
                region,
                oidcParams: c.sts.oidcParams,
                durationSeconds: c.sts.durationSeconds,
                role: c.sts.role,
                nameOfBucketToCreateIfNotExist: undefined
            };

            return {
                origin: "defined in region",
                id: fnv1aHashToHex(
                    JSON.stringify(
                        Object.fromEntries(
                            Object.entries(c).sort(([key1], [key2]) =>
                                key1.localeCompare(key2)
                            )
                        )
                    )
                ),
                bookmarks: c.bookmarks.map(({ title, bucket, keyPrefix }) => ({
                    displayName: title,
                    bucket,
                    keyPrefix
                })),
                paramsOfCreateS3Client,
                credentialsTestStatus: getCredentialsTestStatus({
                    paramsOfCreateS3Client
                }),
                isXOnyxiaDefault: false,
                isExplorerConfig: false
            };
        })
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
