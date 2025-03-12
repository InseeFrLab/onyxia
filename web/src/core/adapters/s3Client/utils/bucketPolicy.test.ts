import { it, expect, describe } from "vitest";
import { symToStr } from "tsafe/symToStr";
import { removeObjectNameFromListBucketCondition } from "./bucketPolicy";
import { S3BucketPolicy } from "core/ports/S3Client";

describe(symToStr({ removeObjectNameFromListBucketCondition }), () => {
    it("One object", () => {
        const bucketArn = "bucketArn";
        const objectName = "objectName";
        const statements: S3BucketPolicy["Statement"] = [
            {
                Action: ["s3:ListBucket"],
                Condition: {
                    StringEquals: {
                        "s3:prefix": [objectName]
                    }
                },
                Effect: "Allow",
                Principal: {
                    AWS: ["*"]
                },
                Resource: [bucketArn]
            }
        ];

        const expected: S3BucketPolicy["Statement"] = [];

        expect(
            removeObjectNameFromListBucketCondition(statements, bucketArn, objectName)
        ).toStrictEqual(expected);
    });

    it("Two objects", () => {
        const bucketArn = "bucketArn";
        const objectName = "objectName";
        const statements: S3BucketPolicy["Statement"] = [
            {
                Action: ["s3:ListBucket"],
                Condition: {
                    StringEquals: {
                        "s3:prefix": [objectName, "objectName2"]
                    }
                },
                Effect: "Allow",
                Principal: {
                    AWS: ["*"]
                },
                Resource: [bucketArn]
            }
        ];

        const expected: S3BucketPolicy["Statement"] = [
            {
                Action: ["s3:ListBucket"],
                Condition: {
                    StringEquals: {
                        "s3:prefix": ["objectName2"]
                    }
                },
                Effect: "Allow",
                Principal: {
                    AWS: ["*"]
                },
                Resource: [bucketArn]
            }
        ];

        expect(
            removeObjectNameFromListBucketCondition(statements, bucketArn, objectName)
        ).toStrictEqual(expected);
    });

    it("No matching objectName in s3:prefix, return unchanged", () => {
        const bucketArn = "bucketArn";
        const objectName = "nonexistent";
        const statements: S3BucketPolicy["Statement"] = [
            {
                Action: ["s3:ListBucket"],
                Condition: {
                    StringEquals: {
                        "s3:prefix": ["objectName1", "objectName2"]
                    }
                },
                Effect: "Allow",
                Principal: {
                    AWS: ["*"]
                },
                Resource: [bucketArn]
            }
        ];

        expect(
            removeObjectNameFromListBucketCondition(statements, bucketArn, objectName)
        ).toStrictEqual(statements);
    });

    it("Multiple statements, only one affected", () => {
        const bucketArn = "bucketArn";
        const objectName = "objectName";
        const statements: S3BucketPolicy["Statement"] = [
            {
                Action: ["s3:ListBucket"],
                Condition: {
                    StringEquals: {
                        "s3:prefix": [objectName, "objectName2"]
                    }
                },
                Effect: "Allow",
                Principal: {
                    AWS: ["*"]
                },
                Resource: [bucketArn]
            },
            {
                Action: ["s3:ListBucket"],
                Condition: {
                    StringEquals: {
                        "s3:prefix": ["otherDir"]
                    }
                },
                Effect: "Allow",
                Principal: {
                    AWS: ["*"]
                },
                Resource: [bucketArn]
            }
        ];

        const expected: S3BucketPolicy["Statement"] = [
            {
                Action: ["s3:ListBucket"],
                Condition: {
                    StringEquals: {
                        "s3:prefix": ["objectName2"]
                    }
                },
                Effect: "Allow",
                Principal: {
                    AWS: ["*"]
                },
                Resource: [bucketArn]
            },
            {
                Action: ["s3:ListBucket"],
                Condition: {
                    StringEquals: {
                        "s3:prefix": ["otherDir"]
                    }
                },
                Effect: "Allow",
                Principal: {
                    AWS: ["*"]
                },
                Resource: [bucketArn]
            }
        ];

        expect(
            removeObjectNameFromListBucketCondition(statements, bucketArn, objectName)
        ).toStrictEqual(expected);
    });

    it("Statement without StringEquals remains unchanged", () => {
        const bucketArn = "bucketArn";
        const objectName = "objectName";
        const statements: S3BucketPolicy["Statement"] = [
            {
                Action: ["s3:ListBucket"],
                Condition: {
                    StringLike: {
                        "s3:prefix": ["objectName"]
                    }
                },
                Effect: "Allow",
                Principal: {
                    AWS: ["*"]
                },
                Resource: [bucketArn]
            }
        ];

        expect(
            removeObjectNameFromListBucketCondition(statements, bucketArn, objectName)
        ).toStrictEqual(statements);
    });

    it("Condition is removed but other conditions exist, keep statement", () => {
        const bucketArn = "bucketArn";
        const objectName = "objectName";
        const statements: S3BucketPolicy["Statement"] = [
            {
                Action: ["s3:ListBucket"],
                Condition: {
                    StringEquals: {
                        "s3:prefix": [objectName]
                    },
                    NumericEquals: {
                        "aws:MultiFactorAuthAge": 300
                    }
                },
                Effect: "Allow",
                Principal: {
                    AWS: ["*"]
                },
                Resource: [bucketArn]
            }
        ];

        const expected: S3BucketPolicy["Statement"] = [
            {
                Action: ["s3:ListBucket"],
                Condition: {
                    NumericEquals: {
                        "aws:MultiFactorAuthAge": 300
                    }
                },
                Effect: "Allow",
                Principal: {
                    AWS: ["*"]
                },
                Resource: [bucketArn]
            }
        ];

        expect(
            removeObjectNameFromListBucketCondition(statements, bucketArn, objectName)
        ).toStrictEqual(expected);
    });

    it("Empty statements array, should return empty array", () => {
        expect(
            removeObjectNameFromListBucketCondition([], "bucketArn", "objectName")
        ).toStrictEqual([]);
    });

    it("Bucket ARN does not match, should return unchanged", () => {
        const statements: S3BucketPolicy["Statement"] = [
            {
                Action: ["s3:ListBucket"],
                Condition: {
                    StringEquals: {
                        "s3:prefix": ["objectName"]
                    }
                },
                Effect: "Allow",
                Principal: {
                    AWS: ["*"]
                },
                Resource: ["otherBucketArn"]
            }
        ];

        expect(
            removeObjectNameFromListBucketCondition(
                statements,
                "bucketArn",
                "object@Name"
            )
        ).toStrictEqual(statements);
    });
});
