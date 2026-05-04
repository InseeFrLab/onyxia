import type { S3Uri } from "core/tools/S3Uri";

export type BucketPolicies = Record<string, unknown>;

type BucketPoliciesByBucket = Record<
    string,
    { bucketPolicies: BucketPolicies | undefined } | undefined
>;

const SID_PREFIX = "Onyxia";

export function getHasPrefixBeMadePublic(params: {
    s3Uri: S3Uri.TerminatedByDelimiter;
    bucketPoliciesByBucket: BucketPoliciesByBucket;
}): boolean {
    // TODO
    return false;
}

export function getIsWithinPrefixThatHasBeenMadePublic(params: {
    s3Uri: S3Uri;
    bucketPoliciesByBucket: BucketPoliciesByBucket;
}): boolean {
    // TODO
    return false;
}

export function makePrefixPublic(params: {
    s3Uri: S3Uri.TerminatedByDelimiter;
    bucketPoliciesByBucket: BucketPoliciesByBucket;
}): {
    bucket: string;
    updatedBucketPolicies: BucketPolicies;
    awsS3CliEmulatedCommand: { cmd: string; resp: string };
} {
    // TODO
    return null;
}

export function undoMakePrefixPublic(params: {
    s3Uri: S3Uri.TerminatedByDelimiter;
    bucketPoliciesByBucket: BucketPoliciesByBucket;
}): {
    bucket: string;
    updatedBucketPolicies: BucketPolicies;
    awsS3CliEmulatedCommand: { cmd: string; resp: string };
} {
    // TODO
    return null;
}
