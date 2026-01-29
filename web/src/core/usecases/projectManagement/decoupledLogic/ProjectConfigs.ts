import { assert, type Equals } from "tsafe/assert";
import * as userConfigs from "core/usecases/userConfigs";
import type { StringifyableAtomic } from "core/tools/Stringifyable";
import { z } from "zod";
import { id } from "tsafe/id";
import type { OptionalIfCanBeUndefined } from "core/tools/OptionalIfCanBeUndefined";
import { zStringifyableAtomic } from "core/tools/Stringifyable";
import type { S3UriPrefixObj } from "core/tools/S3Uri";

export type ProjectConfigs = {
    __modelVersion: 2;
    servicePassword: string;
    restorableServiceConfigs: ProjectConfigs.RestorableServiceConfig[];
    s3Profiles: ProjectConfigs.S3Profile[];
    clusterNotificationCheckoutTime: number;
};

export namespace ProjectConfigs {
    export type S3Profile = {
        profileName: string;
        creationTime: number;
        url: string;
        region: string | undefined;
        pathStyleAccess: boolean;
        credentials:
            | {
                  accessKeyId: string;
                  secretAccessKey: string;
                  sessionToken: string | undefined;
              }
            | undefined;
        bookmarks: S3Profile.Bookmark[] | undefined;
    };

    export namespace S3Profile {
        export type Bookmark = {
            displayName: string | undefined;
            s3UriPrefixObj: S3UriPrefixObj;
        };
    }

    export type RestorableServiceConfig = {
        friendlyName: string;
        isShared: boolean | undefined;
        catalogId: string;
        chartName: string;
        chartVersion: string;
        s3ProfileName: string | undefined;
        helmValuesPatch: {
            path: (string | number)[];
            value: StringifyableAtomic | undefined;
        }[];
    };
}

// NOTE: Make sure there's no overlap between userConfigs and projectConfigs as they share the same vault dir.
assert<Equals<keyof ProjectConfigs & keyof userConfigs.UserConfigs, never>>(true);

const zHelmValuesPatch = (() => {
    type TargetType = ProjectConfigs.RestorableServiceConfig["helmValuesPatch"][number];

    const zTargetType = z.object({
        path: z.array(z.union([z.string(), z.number()])),
        value: z.union([zStringifyableAtomic, z.undefined()])
    });

    assert<Equals<z.infer<typeof zTargetType>, OptionalIfCanBeUndefined<TargetType>>>();

    // @ts-expect-error
    return id<z.ZodType<TargetType>>(zTargetType);
})();

const zRestorableServiceConfig = (() => {
    type TargetType = ProjectConfigs.RestorableServiceConfig;

    const zTargetType = z.object({
        friendlyName: z.string(),
        isShared: z.union([z.boolean(), z.undefined()]),
        catalogId: z.string(),
        chartName: z.string(),
        chartVersion: z.string(),
        s3ProfileName: z.union([z.string(), z.undefined()]),
        helmValuesPatch: z.array(zHelmValuesPatch)
    });

    assert<Equals<z.infer<typeof zTargetType>, OptionalIfCanBeUndefined<TargetType>>>();

    // @ts-expect-error
    return id<z.ZodType<TargetType>>(zTargetType);
})();

const zS3Credentials = (() => {
    type TargetType = Exclude<ProjectConfigs.S3Profile["credentials"], undefined>;

    const zTargetType = z.object({
        accessKeyId: z.string(),
        secretAccessKey: z.string(),
        sessionToken: z.union([z.string(), z.undefined()])
    });

    assert<Equals<z.infer<typeof zTargetType>, OptionalIfCanBeUndefined<TargetType>>>();

    // @ts-expect-error
    return id<z.ZodType<TargetType>>(zTargetType);
})();

const zS3ConfigBookmark = (() => {
    type TargetType = ProjectConfigs.S3Profile.Bookmark;

    const zTargetType = z.object({
        displayName: z.union([z.string(), z.undefined()]),
        s3UriPrefixObj: z.object({
            bucket: z.string(),
            keyPrefix: z.string()
        })
    });

    assert<Equals<z.infer<typeof zTargetType>, OptionalIfCanBeUndefined<TargetType>>>();

    // @ts-expect-error
    return id<z.ZodType<TargetType>>(zTargetType);
})();

const zS3Profile = (() => {
    type TargetType = ProjectConfigs.S3Profile;

    const zTargetType = z.object({
        creationTime: z.number(),
        profileName: z.string(),
        url: z.string(),
        region: z.union([z.string(), z.undefined()]),
        workingDirectoryPath: z.string(),
        pathStyleAccess: z.boolean(),
        credentials: z.union([zS3Credentials, z.undefined()]),
        bookmarks: z.union([z.array(zS3ConfigBookmark), z.undefined()])
    });

    assert<Equals<z.infer<typeof zTargetType>, OptionalIfCanBeUndefined<TargetType>>>;

    // @ts-expect-error
    return id<z.ZodType<TargetType>>(zTargetType);
})();

export const zProjectConfigs = (() => {
    type TargetType = ProjectConfigs;

    const zTargetType = z.object({
        __modelVersion: z.literal(2),
        servicePassword: z.string(),
        restorableServiceConfigs: z.array(zRestorableServiceConfig),
        s3Profiles: z.array(zS3Profile),
        clusterNotificationCheckoutTime: z.number()
    });

    assert<Equals<z.infer<typeof zTargetType>, TargetType>>();

    return id<z.ZodType<TargetType>>(zTargetType);
})();
