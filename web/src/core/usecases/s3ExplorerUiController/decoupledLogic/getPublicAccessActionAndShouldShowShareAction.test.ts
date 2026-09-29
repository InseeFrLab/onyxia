import { describe, expect, it } from "vitest";
import { assert } from "tsafe/assert";
import { parseS3Uri, type S3Uri } from "core/tools/S3Uri";
import type { BucketPoliciesByBucket } from "./bucketPolicies";
import { makePrefixPublic } from "./bucketPolicies";
import { getPublicAccessActionAndShouldShowShareAction } from "./getPublicAccessActionAndShouldShowShareAction";

function parsePrefix(value: string): S3Uri.TerminatedByDelimiter {
    const s3Uri = parseS3Uri({ value, delimiter: "/" });

    assert(s3Uri.isDelimiterTerminated);

    return s3Uri;
}

function getBucketPoliciesByBucket(): BucketPoliciesByBucket {
    return {
        mybucket: {
            bucketPolicies: {
                Version: "2012-10-17",
                Statement: []
            }
        }
    };
}

describe("getPublicAccessActionAndShouldShowShareAction", () => {
    it("hides policy-dependent actions when bucket policies are unavailable", () => {
        const s3Uri = parsePrefix("s3://mybucket/folder/");

        expect(
            getPublicAccessActionAndShouldShowShareAction({
                s3Uri,
                bucketPoliciesByBucket: {},
                isAnonymousS3Profile: false,
                isSharingPublicFolderFeatureEnabled: true
            })
        ).toStrictEqual({
            publicAccessAction: undefined,
            shouldShowShareAction: false
        });
    });

    it("keeps sharing available for anonymous profiles without bucket policies", () => {
        const s3Uri = parsePrefix("s3://mybucket/folder/");

        expect(
            getPublicAccessActionAndShouldShowShareAction({
                s3Uri,
                bucketPoliciesByBucket: {},
                isAnonymousS3Profile: true,
                isSharingPublicFolderFeatureEnabled: true
            })
        ).toStrictEqual({
            publicAccessAction: undefined,
            shouldShowShareAction: true
        });
    });

    it("offers making a private prefix public when bucket policies are available", () => {
        const s3Uri = parsePrefix("s3://mybucket/folder/");

        expect(
            getPublicAccessActionAndShouldShowShareAction({
                s3Uri,
                bucketPoliciesByBucket: getBucketPoliciesByBucket(),
                isAnonymousS3Profile: false,
                isSharingPublicFolderFeatureEnabled: true
            })
        ).toStrictEqual({
            publicAccessAction: "make public",
            shouldShowShareAction: false
        });
    });

    it("offers making an exact public prefix private and allows sharing it", () => {
        const s3Uri = parsePrefix("s3://mybucket/folder/");
        const { updatedBucketPolicies } = makePrefixPublic({
            s3Uri,
            bucketPoliciesByBucket: getBucketPoliciesByBucket()
        });

        expect(
            getPublicAccessActionAndShouldShowShareAction({
                s3Uri,
                bucketPoliciesByBucket: {
                    mybucket: { bucketPolicies: updatedBucketPolicies }
                },
                isAnonymousS3Profile: false,
                isSharingPublicFolderFeatureEnabled: true
            })
        ).toStrictEqual({
            publicAccessAction: "make private",
            shouldShowShareAction: true
        });
    });

    it("allows sharing a nested public prefix without offering a policy change", () => {
        const publicPrefix = parsePrefix("s3://mybucket/folder/");
        const { updatedBucketPolicies } = makePrefixPublic({
            s3Uri: publicPrefix,
            bucketPoliciesByBucket: getBucketPoliciesByBucket()
        });

        expect(
            getPublicAccessActionAndShouldShowShareAction({
                s3Uri: parsePrefix("s3://mybucket/folder/nested/"),
                bucketPoliciesByBucket: {
                    mybucket: { bucketPolicies: updatedBucketPolicies }
                },
                isAnonymousS3Profile: false,
                isSharingPublicFolderFeatureEnabled: true
            })
        ).toStrictEqual({
            publicAccessAction: undefined,
            shouldShowShareAction: true
        });
    });

    it("hides sharing when the feature is disabled", () => {
        const s3Uri = parsePrefix("s3://mybucket/folder/");
        const { updatedBucketPolicies } = makePrefixPublic({
            s3Uri,
            bucketPoliciesByBucket: getBucketPoliciesByBucket()
        });

        expect(
            getPublicAccessActionAndShouldShowShareAction({
                s3Uri,
                bucketPoliciesByBucket: {
                    mybucket: { bucketPolicies: updatedBucketPolicies }
                },
                isAnonymousS3Profile: false,
                isSharingPublicFolderFeatureEnabled: false
            })
        ).toStrictEqual({
            publicAccessAction: "make private",
            shouldShowShareAction: false
        });
    });
});
