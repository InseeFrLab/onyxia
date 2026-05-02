import { afterEach, describe, expect, it, vi } from "vitest";
import { symToStr } from "tsafe/symToStr";
import type { S3Client } from "core/ports/S3Client";
import { parseS3Uri } from "core/tools/S3Uri";
import { getIsPublic } from "./bucketPolicy";

const bucketPolicies = {
    Version: "2012-10-17",
    Statement: [
        {
            Sid: "PublicReadWholeBucket",
            Effect: "Allow",
            Principal: "*",
            Action: "s3:GetObject",
            Resource: "arn:aws:s3:::my-bucket/*"
        },
        {
            Sid: "PrivateDenySecretPrefix",
            Effect: "Deny",
            Principal: "*",
            Action: "s3:GetObject",
            Resource: "arn:aws:s3:::my-bucket/images/private/*"
        },
        {
            Sid: "PublicReadSingleFileInOtherBucket",
            Effect: "Allow",
            Principal: "*",
            Action: "s3:GetObject",
            Resource: "arn:aws:s3:::other-bucket/public/logo.png"
        }
    ]
} satisfies S3Client.BucketPolicies;

function createBucketPolicyByBucket(params: {
    bucket: string;
    bucketPolicies: S3Client.BucketPolicies | undefined;
}): Parameters<typeof getIsPublic>[0]["bucketPolicyByBucket"] {
    const { bucket, bucketPolicies } = params;

    return {
        [bucket]: {
            bucketPolicies
        }
    };
}

describe(symToStr({ getIsPublic }), () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it("returns true when a public GetObject statement matches an object", () => {
        expect(
            getIsPublic({
                bucketPolicyByBucket: createBucketPolicyByBucket({
                    bucket: "my-bucket",
                    bucketPolicies
                }),
                s3Uri: parseS3Uri({
                    value: "s3://my-bucket/images/logo.png",
                    delimiter: "/"
                })
            })
        ).toBe(true);
    });

    it("returns true when a public wildcard statement covers a prefix", () => {
        expect(
            getIsPublic({
                bucketPolicyByBucket: createBucketPolicyByBucket({
                    bucket: "my-bucket",
                    bucketPolicies
                }),
                s3Uri: parseS3Uri({
                    value: "s3://my-bucket/images/",
                    delimiter: "/"
                })
            })
        ).toBe(true);
    });

    it("returns false when a public deny statement also matches", () => {
        expect(
            getIsPublic({
                bucketPolicyByBucket: createBucketPolicyByBucket({
                    bucket: "my-bucket",
                    bucketPolicies
                }),
                s3Uri: parseS3Uri({
                    value: "s3://my-bucket/images/private/secret.txt",
                    delimiter: "/"
                })
            })
        ).toBe(false);
    });

    it("does not match policies from another bucket", () => {
        expect(
            getIsPublic({
                bucketPolicyByBucket: createBucketPolicyByBucket({
                    bucket: "not-my-bucket",
                    bucketPolicies
                }),
                s3Uri: parseS3Uri({
                    value: "s3://not-my-bucket/images/logo.png",
                    delimiter: "/"
                })
            })
        ).toBe(false);
    });

    it("accepts a single Statement object and AWS principal shorthand", () => {
        expect(
            getIsPublic({
                bucketPolicyByBucket: createBucketPolicyByBucket({
                    bucket: "my-bucket",
                    bucketPolicies: {
                        Statement: {
                            Effect: "Allow",
                            Principal: { AWS: "*" },
                            Action: ["s3:PutObject", "s3:Get*"],
                            Resource: "arn:aws:s3:::my-bucket/public/logo.png"
                        }
                    }
                }),
                s3Uri: parseS3Uri({
                    value: "s3://my-bucket/public/logo.png",
                    delimiter: "/"
                })
            })
        ).toBe(true);
    });

    it("does not grant public status for authenticated principals", () => {
        expect(
            getIsPublic({
                bucketPolicyByBucket: createBucketPolicyByBucket({
                    bucket: "my-bucket",
                    bucketPolicies: {
                        Statement: [
                            {
                                Effect: "Allow",
                                Principal: {
                                    AWS: "arn:aws:iam::123456789012:user/alice"
                                },
                                Action: "s3:GetObject",
                                Resource: "arn:aws:s3:::my-bucket/uploads/*"
                            }
                        ]
                    }
                }),
                s3Uri: parseS3Uri({
                    value: "s3://my-bucket/uploads/report.csv",
                    delimiter: "/"
                })
            })
        ).toBe(false);
    });

    it("evaluates supported aws:CurrentTime date conditions", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-04-30T00:00:00Z"));

        expect(
            getIsPublic({
                bucketPolicyByBucket: createBucketPolicyByBucket({
                    bucket: "my-bucket",
                    bucketPolicies: {
                        Statement: [
                            {
                                Effect: "Allow",
                                Principal: "*",
                                Action: "s3:GetObject",
                                Resource: "arn:aws:s3:::my-bucket/temporary-public/*",
                                Condition: {
                                    DateLessThan: {
                                        "aws:CurrentTime": "2026-12-31T23:59:59Z"
                                    }
                                }
                            }
                        ]
                    }
                }),
                s3Uri: parseS3Uri({
                    value: "s3://my-bucket/temporary-public/file.txt",
                    delimiter: "/"
                })
            })
        ).toBe(true);

        expect(
            getIsPublic({
                bucketPolicyByBucket: createBucketPolicyByBucket({
                    bucket: "my-bucket",
                    bucketPolicies: {
                        Statement: [
                            {
                                Effect: "Allow",
                                Principal: "*",
                                Action: "s3:GetObject",
                                Resource: "arn:aws:s3:::my-bucket/temporary-public/*",
                                Condition: {
                                    DateLessThan: {
                                        "aws:CurrentTime": "2026-01-01T00:00:00Z"
                                    }
                                }
                            }
                        ]
                    }
                }),
                s3Uri: parseS3Uri({
                    value: "s3://my-bucket/temporary-public/file.txt",
                    delimiter: "/"
                })
            })
        ).toBe(false);
    });

    it("does not treat unsupported allow conditions as public", () => {
        expect(
            getIsPublic({
                bucketPolicyByBucket: createBucketPolicyByBucket({
                    bucket: "my-bucket",
                    bucketPolicies: {
                        Statement: [
                            {
                                Effect: "Allow",
                                Principal: "*",
                                Action: "s3:GetObject",
                                Resource: "arn:aws:s3:::my-bucket/ip-restricted/*",
                                Condition: {
                                    IpAddress: {
                                        "aws:SourceIp": "203.0.113.0/24"
                                    }
                                }
                            }
                        ]
                    }
                }),
                s3Uri: parseS3Uri({
                    value: "s3://my-bucket/ip-restricted/file.txt",
                    delimiter: "/"
                })
            })
        ).toBe(false);
    });

    it("returns undefined when bucket policies are not loaded for the bucket", () => {
        expect(
            getIsPublic({
                bucketPolicyByBucket: {},
                s3Uri: parseS3Uri({
                    value: "s3://my-bucket/images/logo.png",
                    delimiter: "/"
                })
            })
        ).toBeUndefined();

        expect(
            getIsPublic({
                bucketPolicyByBucket: createBucketPolicyByBucket({
                    bucket: "my-bucket",
                    bucketPolicies: undefined
                }),
                s3Uri: parseS3Uri({
                    value: "s3://my-bucket/images/logo.png",
                    delimiter: "/"
                })
            })
        ).toBeUndefined();
    });
});
