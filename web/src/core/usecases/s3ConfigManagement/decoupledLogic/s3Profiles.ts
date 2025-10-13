import * as projectManagement from "core/usecases/projectManagement";
import type { DeploymentRegion } from "core/ports/OnyxiaApi/DeploymentRegion";
import type { ParamsOfCreateS3Client } from "core/adapters/s3Client";
import { same } from "evt/tools/inDepth/same";
import { fnv1aHashToHex } from "core/tools/fnv1aHashToHex";
import { assert, type Equals, id } from "tsafe";
import { s3Profile_fromVault_getId } from "./s3Profile_fromVault_id";
import type * as s3ConfigConnectionTest from "core/usecases/s3ConfigConnectionTest";
import type { LocalizedString } from "core/ports/OnyxiaApi";

export type S3Profile = S3Profile.FromRegion | S3Profile.FromVault;

export namespace S3Profile {
    type Common = {
        id: string;
        isXOnyxiaDefault: boolean;
        isExplorerConfig: boolean;
    };

    export type FromRegion = Common & {
        origin: "region";
        paramsOfCreateS3Client: ParamsOfCreateS3Client.Sts;
        bookmarks: Bookmark[];
    };

    export type FromVault = Common & {
        origin: "vault";
        paramsOfCreateS3Client: ParamsOfCreateS3Client.NoSts;
        creationTime: number;
        friendlyName: string;
        connectionTestStatus:
            | { status: "not tested" }
            | { status: "test ongoing" }
            | { status: "test failed"; errorMessage: string }
            | { status: "test succeeded" };
    };

    export type Bookmark = {
        title: LocalizedString;
        description?: LocalizedString;
        tags: LocalizedString[] | undefined;
        bucket: string;
        keyPrefix: string;
    };
}

export function aggregateS3ProfilesFromVaultAndRegionIntoAnUnifiedSet(params: {
    fromVault: projectManagement.ProjectConfigs["s3"];
    fromRegion: {
        s3Config: DeploymentRegion.S3Config;
        bookmarks: S3Profile.Bookmark[];
    }[];
    connectionTestsState: {
        results: s3ConfigConnectionTest.ConfigTestResult[];
        ongoing: s3ConfigConnectionTest.OngoingConfigTest[];
    };
}): S3Profile[] {
    const { fromVault, fromRegion, connectionTestsState } = params;

    const getConnectionTestStatus = (params: {
        paramsOfCreateS3Client: ParamsOfCreateS3Client;
    }): S3Profile.FromVault["connectionTestStatus"] => {
        const { paramsOfCreateS3Client } = params;

        if (
            connectionTestsState.ongoing.find(e =>
                same(e.paramsOfCreateS3Client, paramsOfCreateS3Client)
            ) !== undefined
        ) {
            return { status: "test ongoing" };
        }

        has_result: {
            const { result } =
                connectionTestsState.results.find(e =>
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
            .map((c): S3Profile.FromVault => {
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
                    origin: "vault",
                    creationTime: c.creationTime,
                    friendlyName: c.friendlyName,
                    id: s3Profile_fromVault_getId({
                        creationTime: c.creationTime
                    }),
                    paramsOfCreateS3Client,
                    isXOnyxiaDefault: false,
                    isExplorerConfig: false,
                    connectionTestStatus: getConnectionTestStatus({
                        paramsOfCreateS3Client
                    })
                };
            })
            .sort((a, b) => b.creationTime - a.creationTime),
        ...fromRegion.map(({ s3Config: c, bookmarks }): S3Profile.FromRegion => {
            const url = c.url;
            const pathStyleAccess = c.pathStyleAccess;
            const region = c.region;

            return {
                origin: "region",
                id: `region-${fnv1aHashToHex(
                    JSON.stringify(
                        Object.fromEntries(
                            Object.entries(c).sort(([key1], [key2]) =>
                                key1.localeCompare(key2)
                            )
                        )
                    )
                )}`,
                bookmarks,
                paramsOfCreateS3Client: id<ParamsOfCreateS3Client.Sts>({
                    url,
                    pathStyleAccess,
                    isStsEnabled: true,
                    stsUrl: c.sts.url,
                    region,
                    oidcParams: c.sts.oidcParams,
                    durationSeconds: c.sts.durationSeconds,
                    role: c.sts.role
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
            s3Profiles.find(s3Config => s3Config.origin === "region");

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
        }
        assert<Equals<typeof prop, never>>(false);
    });

    return s3Profiles;
}
