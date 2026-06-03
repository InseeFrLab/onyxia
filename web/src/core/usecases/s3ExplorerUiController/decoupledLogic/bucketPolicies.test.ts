import { describe, expect, it } from "vitest";
import { assert } from "tsafe/assert";
import { parseS3Uri, type S3Uri } from "core/tools/S3Uri";
import {
    getHasPrefixBeMadePublic,
    getIsWithinPrefixThatHasBeenMadePublic,
    makePrefixPublic,
    undoMakePrefixPublic,
    type BucketPolicies
} from "./bucketPolicies";

function parsePrefix(value: string): S3Uri.TerminatedByDelimiter {
    const s3Uri = parseS3Uri({ value, delimiter: "/" });

    assert(s3Uri.isDelimiterTerminated);

    return s3Uri;
}

function parseObject(value: string): S3Uri.NonTerminatedByDelimiter {
    const s3Uri = parseS3Uri({ value, delimiter: "/" });

    assert(!s3Uri.isDelimiterTerminated);

    return s3Uri;
}

function getBucketPoliciesByBucket(bucketPolicies: BucketPolicies) {
    return {
        mybucket: {
            bucketPolicies
        }
    };
}

describe("bucketPolicies", () => {
    it("assumes private when the bucket policy is unavailable", () => {
        const s3Uri = parsePrefix("s3://mybucket/public/");

        expect(
            getHasPrefixBeMadePublic({
                s3Uri,
                bucketPoliciesByBucket: {}
            })
        ).toBe(false);

        expect(
            getIsWithinPrefixThatHasBeenMadePublic({
                s3Uri,
                bucketPoliciesByBucket: {}
            })
        ).toStrictEqual({ isWithinPrefixThatHasBeenMadePublic: false });

        expect(() =>
            makePrefixPublic({
                s3Uri,
                bucketPoliciesByBucket: {}
            })
        ).toThrow();

        expect(() =>
            undoMakePrefixPublic({
                s3Uri,
                bucketPoliciesByBucket: {}
            })
        ).toThrow();
    });

    it("creates managed statements and detects exact and nested public prefixes", () => {
        const unrelatedStatement = {
            Sid: "ExternalPublicPrefix",
            Effect: "Allow",
            Principal: "*",
            Action: "s3:GetObject",
            Resource: "arn:aws:s3:::mybucket/elsewhere/*"
        };

        const bucketPolicies: BucketPolicies = {
            Version: "2012-10-17",
            Statement: [unrelatedStatement]
        };

        const s3Uri = parsePrefix("s3://mybucket/data/public/");

        const { updatedBucketPolicies, awsS3CliEmulatedCommand } = makePrefixPublic({
            s3Uri,
            bucketPoliciesByBucket: getBucketPoliciesByBucket(bucketPolicies)
        });

        expect(bucketPolicies.Statement).toStrictEqual([unrelatedStatement]);

        const statements = updatedBucketPolicies.Statement;

        assert(Array.isArray(statements));

        expect(statements).toHaveLength(3);
        expect(statements[0]).toBe(unrelatedStatement);
        expect(statements[1]).toMatchObject({
            Sid: "OnyxiaMakePrefixPublicGetObject",
            Effect: "Allow",
            Principal: "*",
            Action: "s3:GetObject",
            Resource: ["arn:aws:s3:::mybucket/data/public/*"]
        });
        expect(statements[2]).toMatchObject({
            Sid: "OnyxiaMakePrefixPublicListBucket",
            Effect: "Allow",
            Principal: "*",
            Action: "s3:ListBucket",
            Resource: "arn:aws:s3:::mybucket",
            Condition: {
                StringLike: {
                    "s3:prefix": ["data/public/*"]
                }
            }
        });
        expect(awsS3CliEmulatedCommand.cmd).toBe(
            [
                "aws s3api put-bucket-policy \\",
                "  --bucket 'mybucket' \\",
                `  --policy '${JSON.stringify(updatedBucketPolicies, null, 2)}'`
            ].join("\n")
        );

        const bucketPoliciesByBucket = getBucketPoliciesByBucket(updatedBucketPolicies);

        expect(
            getHasPrefixBeMadePublic({
                s3Uri,
                bucketPoliciesByBucket
            })
        ).toBe(true);

        expect(
            getHasPrefixBeMadePublic({
                s3Uri: parsePrefix("s3://mybucket/data/public/nested/"),
                bucketPoliciesByBucket
            })
        ).toBe(false);

        expect(
            getIsWithinPrefixThatHasBeenMadePublic({
                s3Uri: parseObject("s3://mybucket/data/public/file.csv"),
                bucketPoliciesByBucket
            })
        ).toStrictEqual({
            isWithinPrefixThatHasBeenMadePublic: true,
            s3Uri_publicPrefix: parsePrefix("s3://mybucket/data/public/")
        });

        expect(
            getIsWithinPrefixThatHasBeenMadePublic({
                s3Uri: parsePrefix("s3://mybucket/data/public/nested/"),
                bucketPoliciesByBucket
            })
        ).toStrictEqual({
            isWithinPrefixThatHasBeenMadePublic: true,
            s3Uri_publicPrefix: parsePrefix("s3://mybucket/data/public/")
        });

        expect(
            getIsWithinPrefixThatHasBeenMadePublic({
                s3Uri: parseObject("s3://mybucket/data/public"),
                bucketPoliciesByBucket
            })
        ).toStrictEqual({ isWithinPrefixThatHasBeenMadePublic: false });

        expect(
            getIsWithinPrefixThatHasBeenMadePublic({
                s3Uri: parseObject("s3://mybucket/data/private/file.csv"),
                bucketPoliciesByBucket
            })
        ).toStrictEqual({ isWithinPrefixThatHasBeenMadePublic: false });
    });

    it("returns the public prefix that contains an object", () => {
        const updatedBucketPolicies = makePrefixPublic({
            s3Uri: parsePrefix("s3://mybucket/foo/"),
            bucketPoliciesByBucket: getBucketPoliciesByBucket({
                Version: "2012-10-17",
                Statement: []
            })
        }).updatedBucketPolicies;

        expect(
            getIsWithinPrefixThatHasBeenMadePublic({
                s3Uri: parseObject("s3://mybucket/foo/bar/data.parquet"),
                bucketPoliciesByBucket: getBucketPoliciesByBucket(updatedBucketPolicies)
            })
        ).toStrictEqual({
            isWithinPrefixThatHasBeenMadePublic: true,
            s3Uri_publicPrefix: parsePrefix("s3://mybucket/foo/")
        });
    });

    it("ignores public statements that were not created by this utility", () => {
        const bucketPolicies: BucketPolicies = {
            Version: "2012-10-17",
            Statement: [
                {
                    Sid: "ExternalPublicPrefix",
                    Effect: "Allow",
                    Principal: "*",
                    Action: "s3:GetObject",
                    Resource: "arn:aws:s3:::mybucket/public/*"
                }
            ]
        };

        const bucketPoliciesByBucket = getBucketPoliciesByBucket(bucketPolicies);

        expect(
            getHasPrefixBeMadePublic({
                s3Uri: parsePrefix("s3://mybucket/public/"),
                bucketPoliciesByBucket
            })
        ).toBe(false);

        expect(
            getIsWithinPrefixThatHasBeenMadePublic({
                s3Uri: parseObject("s3://mybucket/public/file.csv"),
                bucketPoliciesByBucket
            })
        ).toStrictEqual({ isWithinPrefixThatHasBeenMadePublic: false });
    });

    it("undo removes only managed statements for the selected prefix", () => {
        const unrelatedStatement = {
            Sid: "ExternalStatement",
            Effect: "Deny"
        };

        const initialBucketPolicies: BucketPolicies = {
            Version: "2012-10-17",
            Statement: [unrelatedStatement]
        };

        const publicPrefix = parsePrefix("s3://mybucket/public/");
        const otherPublicPrefix = parsePrefix("s3://mybucket/other-public/");

        const firstUpdate = makePrefixPublic({
            s3Uri: publicPrefix,
            bucketPoliciesByBucket: getBucketPoliciesByBucket(initialBucketPolicies)
        }).updatedBucketPolicies;

        const secondUpdate = makePrefixPublic({
            s3Uri: otherPublicPrefix,
            bucketPoliciesByBucket: getBucketPoliciesByBucket(firstUpdate)
        }).updatedBucketPolicies;

        const { updatedBucketPolicies } = undoMakePrefixPublic({
            s3Uri: publicPrefix,
            bucketPoliciesByBucket: getBucketPoliciesByBucket(secondUpdate)
        });

        const bucketPoliciesByBucket = getBucketPoliciesByBucket(updatedBucketPolicies);

        expect(
            getHasPrefixBeMadePublic({
                s3Uri: publicPrefix,
                bucketPoliciesByBucket
            })
        ).toBe(false);

        expect(
            getHasPrefixBeMadePublic({
                s3Uri: otherPublicPrefix,
                bucketPoliciesByBucket
            })
        ).toBe(true);

        const statements = updatedBucketPolicies.Statement;

        assert(Array.isArray(statements));

        expect(statements).toContain(unrelatedStatement);
        expect(statements).toHaveLength(3);
        expect(statements[1]).toMatchObject({
            Sid: "OnyxiaMakePrefixPublicGetObject",
            Resource: ["arn:aws:s3:::mybucket/other-public/*"]
        });
        expect(statements[2]).toMatchObject({
            Sid: "OnyxiaMakePrefixPublicListBucket",
            Condition: {
                StringLike: {
                    "s3:prefix": ["other-public/*"]
                }
            }
        });
    });

    it("stacks multiple public prefixes in two fixed Sid statements", () => {
        const unrelatedStatement = {
            Sid: "ExternalStatement",
            Effect: "Deny"
        };

        const initialBucketPolicies: BucketPolicies = {
            Version: "2012-10-17",
            Statement: [unrelatedStatement]
        };

        const firstPublicPrefix = parsePrefix("s3://mybucket/public/");
        const secondPublicPrefix = parsePrefix("s3://mybucket/other-public/");

        const firstUpdate = makePrefixPublic({
            s3Uri: firstPublicPrefix,
            bucketPoliciesByBucket: getBucketPoliciesByBucket(initialBucketPolicies)
        }).updatedBucketPolicies;

        const secondUpdate = makePrefixPublic({
            s3Uri: secondPublicPrefix,
            bucketPoliciesByBucket: getBucketPoliciesByBucket(firstUpdate)
        }).updatedBucketPolicies;

        const thirdUpdate = makePrefixPublic({
            s3Uri: firstPublicPrefix,
            bucketPoliciesByBucket: getBucketPoliciesByBucket(secondUpdate)
        }).updatedBucketPolicies;

        const statements = thirdUpdate.Statement;

        assert(Array.isArray(statements));

        expect(statements).toHaveLength(3);
        expect(statements[0]).toBe(unrelatedStatement);
        expect(statements[1]).toMatchObject({
            Sid: "OnyxiaMakePrefixPublicGetObject",
            Resource: [
                "arn:aws:s3:::mybucket/public/*",
                "arn:aws:s3:::mybucket/other-public/*"
            ]
        });
        expect(statements[2]).toMatchObject({
            Sid: "OnyxiaMakePrefixPublicListBucket",
            Resource: "arn:aws:s3:::mybucket",
            Condition: {
                StringLike: {
                    "s3:prefix": ["public/*", "other-public/*"]
                }
            }
        });
    });

    it("migrates legacy per-prefix managed statements when adding a prefix", () => {
        const bucketPolicies: BucketPolicies = {
            Version: "2012-10-17",
            Statement: [
                {
                    Sid: "OnyxiaMakePrefixPublicGetObject12345678",
                    Effect: "Allow",
                    Principal: "*",
                    Action: "s3:GetObject",
                    Resource: "arn:aws:s3:::mybucket/legacy/*"
                },
                {
                    Sid: "OnyxiaMakePrefixPublicListBucket12345678",
                    Effect: "Allow",
                    Principal: "*",
                    Action: "s3:ListBucket",
                    Resource: "arn:aws:s3:::mybucket",
                    Condition: {
                        StringLike: {
                            "s3:prefix": "legacy/*"
                        }
                    }
                }
            ]
        };

        const { updatedBucketPolicies } = makePrefixPublic({
            s3Uri: parsePrefix("s3://mybucket/new-public/"),
            bucketPoliciesByBucket: getBucketPoliciesByBucket(bucketPolicies)
        });

        const statements = updatedBucketPolicies.Statement;

        assert(Array.isArray(statements));

        expect(statements).toHaveLength(2);
        expect(statements[0]).toMatchObject({
            Sid: "OnyxiaMakePrefixPublicGetObject",
            Resource: [
                "arn:aws:s3:::mybucket/legacy/*",
                "arn:aws:s3:::mybucket/new-public/*"
            ]
        });
        expect(statements[1]).toMatchObject({
            Sid: "OnyxiaMakePrefixPublicListBucket",
            Condition: {
                StringLike: {
                    "s3:prefix": ["legacy/*", "new-public/*"]
                }
            }
        });
    });
});
