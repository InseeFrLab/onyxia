import { assert, type Equals } from "tsafe/assert";
import * as userConfigs from "core/usecases/userConfigs";
import type { StringifyableAtomic } from "core/tools/Stringifyable";
import { z } from "zod";
import { id } from "tsafe/id";
import type { OptionalIfCanBeUndefined } from "core/tools/OptionalIfCanBeUndefined";
import { zStringifyableAtomic } from "core/tools/Stringifyable";

export type ProjectConfigs = {
    __modelVersion: 1;
    servicePassword: string;
    restorableConfigs: ProjectConfigs.RestorableServiceConfig[];
    s3: {
        s3Configs: ProjectConfigs.S3Config[];
        s3ConfigId_defaultXOnyxia: string | undefined;
        s3ConfigId_explorer: string | undefined;
    };
    clusterNotificationCheckoutTime: number;
};

export namespace ProjectConfigs {
    export type S3Config = {
        creationTime: number;
        friendlyName: string;
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
    };

    export type RestorableServiceConfig = {
        friendlyName: string;
        isShared: boolean | undefined;
        catalogId: string;
        chartName: string;
        chartVersion: string;
        s3ConfigId: string | undefined;
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
        s3ConfigId: z.union([z.string(), z.undefined()]),
        helmValuesPatch: z.array(zHelmValuesPatch)
    });

    assert<Equals<z.infer<typeof zTargetType>, OptionalIfCanBeUndefined<TargetType>>>();

    // @ts-expect-error
    return id<z.ZodType<TargetType>>(zTargetType);
})();

const zS3Credentials = (() => {
    type TargetType = Exclude<ProjectConfigs.S3Config["credentials"], undefined>;

    const zTargetType = z.object({
        accessKeyId: z.string(),
        secretAccessKey: z.string(),
        sessionToken: z.union([z.string(), z.undefined()])
    });

    assert<Equals<z.infer<typeof zTargetType>, OptionalIfCanBeUndefined<TargetType>>>();

    // @ts-expect-error
    return id<z.ZodType<TargetType>>(zTargetType);
})();

const zS3Config = (() => {
    type TargetType = ProjectConfigs.S3Config;

    const zTargetType = z.object({
        creationTime: z.number(),
        friendlyName: z.string(),
        url: z.string(),
        region: z.union([z.string(), z.undefined()]),
        pathStyleAccess: z.boolean(),
        credentials: z.union([zS3Credentials, z.undefined()])
    });

    assert<Equals<z.infer<typeof zTargetType>, OptionalIfCanBeUndefined<TargetType>>>();

    // @ts-expect-error
    return id<z.ZodType<TargetType>>(zTargetType);
})();

const zS3 = (() => {
    type TargetType = ProjectConfigs["s3"];

    const zTargetType = z.object({
        s3Configs: z.array(zS3Config),
        s3ConfigId_defaultXOnyxia: z.union([z.string(), z.undefined()]),
        s3ConfigId_explorer: z.union([z.string(), z.undefined()])
    });

    assert<Equals<z.infer<typeof zTargetType>, OptionalIfCanBeUndefined<TargetType>>>();

    // @ts-expect-error
    return id<z.ZodType<TargetType>>(zTargetType);
})();

export const zProjectConfigs = (() => {
    type TargetType = ProjectConfigs;

    const zTargetType = z.object({
        __modelVersion: z.literal(1),
        servicePassword: z.string(),
        restorableConfigs: z.array(zRestorableServiceConfig),
        s3: zS3,
        clusterNotificationCheckoutTime: z.number()
    });

    assert<Equals<z.infer<typeof zTargetType>, TargetType>>();

    return id<z.ZodType<TargetType>>(zTargetType);
})();
