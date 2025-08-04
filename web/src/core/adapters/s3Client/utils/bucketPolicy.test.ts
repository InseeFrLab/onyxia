import { it, expect, describe } from "vitest";
import { symToStr } from "tsafe/symToStr";
import {
    addObjectNameToListBucketCondition,
    removeObjectNameFromListBucketCondition
} from "./bucketPolicy";
import type { S3BucketPolicy } from "core/ports/S3Client";

describe(symToStr({ removeObjectNameFromListBucketCondition }), () => {
    const bucketArn = "bucketArn";

    describe("File", () => {
        it("removes single file prefix, leaving no statement", () => {
            const objectName = "objectName";
            const statements: S3BucketPolicy["Statement"] = [
                {
                    Action: ["s3:ListBucket"],
                    Condition: {
                        StringLike: {
                            "s3:prefix": [objectName]
                        }
                    },
                    Effect: "Allow",
                    Principal: { AWS: ["*"] },
                    Resource: [bucketArn]
                }
            ];

            expect(
                removeObjectNameFromListBucketCondition(statements, bucketArn, objectName)
            ).toStrictEqual([]);
        });

        it("removes file from multiple, keeps other files", () => {
            const objectName = "objectName";
            const statements: S3BucketPolicy["Statement"] = [
                {
                    Action: ["s3:ListBucket"],
                    Condition: {
                        StringLike: {
                            "s3:prefix": [objectName, "objectName2"]
                        }
                    },
                    Effect: "Allow",
                    Principal: { AWS: ["*"] },
                    Resource: [bucketArn]
                }
            ];

            const expected = [
                {
                    ...statements[0],
                    Condition: {
                        StringLike: {
                            "s3:prefix": ["objectName2"]
                        }
                    }
                }
            ];

            expect(
                removeObjectNameFromListBucketCondition(statements, bucketArn, objectName)
            ).toStrictEqual(expected);
        });

        it("keeps statement when file prefix is not found", () => {
            const statements: S3BucketPolicy["Statement"] = [
                {
                    Action: ["s3:ListBucket"],
                    Condition: {
                        StringLike: {
                            "s3:prefix": ["objectName1", "objectName2"]
                        }
                    },
                    Effect: "Allow",
                    Principal: { AWS: ["*"] },
                    Resource: [bucketArn]
                }
            ];

            expect(
                removeObjectNameFromListBucketCondition(
                    statements,
                    bucketArn,
                    "nonexistent"
                )
            ).toStrictEqual(statements);
        });

        it("keeps other statements unaffected", () => {
            const objectName = "objectName";
            const statements: S3BucketPolicy["Statement"] = [
                {
                    Action: ["s3:ListBucket"],
                    Condition: {
                        StringLike: {
                            "s3:prefix": [objectName, "objectName2"]
                        }
                    },
                    Effect: "Allow",
                    Principal: { AWS: ["*"] },
                    Resource: [bucketArn]
                },
                {
                    Action: ["s3:ListBucket"],
                    Condition: {
                        StringLike: {
                            "s3:prefix": ["otherDir"]
                        }
                    },
                    Effect: "Allow",
                    Principal: { AWS: ["*"] },
                    Resource: [bucketArn]
                }
            ];

            const expected = [
                {
                    ...statements[0],
                    Condition: {
                        StringLike: {
                            "s3:prefix": ["objectName2"]
                        }
                    }
                },
                statements[1]
            ];

            expect(
                removeObjectNameFromListBucketCondition(statements, bucketArn, objectName)
            ).toStrictEqual(expected);
        });

        it("removes file and leaves unrelated conditions intact", () => {
            const objectName = "objectName";
            const statements: S3BucketPolicy["Statement"] = [
                {
                    Action: ["s3:ListBucket"],
                    Condition: {
                        StringLike: {
                            "s3:prefix": [objectName]
                        },
                        NumericEquals: {
                            "aws:MultiFactorAuthAge": 300
                        }
                    },
                    Effect: "Allow",
                    Principal: { AWS: ["*"] },
                    Resource: [bucketArn]
                }
            ];

            const expected = [
                {
                    Action: ["s3:ListBucket"],
                    Condition: {
                        NumericEquals: {
                            "aws:MultiFactorAuthAge": 300
                        }
                    },
                    Effect: "Allow",
                    Principal: { AWS: ["*"] },
                    Resource: [bucketArn]
                }
            ];

            expect(
                removeObjectNameFromListBucketCondition(statements, bucketArn, objectName)
            ).toStrictEqual(expected);
        });
    });

    describe("Directory (StringLike)", () => {
        it("removes single directory prefix, leaving no statement", () => {
            const objectName = "directoryName/";
            const statements: S3BucketPolicy["Statement"] = [
                {
                    Action: ["s3:ListBucket"],
                    Condition: {
                        StringLike: {
                            "s3:prefix": ["directoryName/*"]
                        }
                    },
                    Effect: "Allow",
                    Principal: { AWS: ["*"] },
                    Resource: [bucketArn]
                }
            ];

            expect(
                removeObjectNameFromListBucketCondition(statements, bucketArn, objectName)
            ).toStrictEqual([]);
        });

        it("removes one directory prefix and leaves others", () => {
            const objectName = "dir1/";
            const statements: S3BucketPolicy["Statement"] = [
                {
                    Action: ["s3:ListBucket"],
                    Condition: {
                        StringLike: {
                            "s3:prefix": ["dir1/*", "dir2/*"]
                        }
                    },
                    Effect: "Allow",
                    Principal: { AWS: ["*"] },
                    Resource: [bucketArn]
                }
            ];

            const expected = [
                {
                    ...statements[0],
                    Condition: {
                        StringLike: {
                            "s3:prefix": ["dir2/*"]
                        }
                    }
                }
            ];

            expect(
                removeObjectNameFromListBucketCondition(statements, bucketArn, objectName)
            ).toStrictEqual(expected);
        });

        it("removes directory but preserves unrelated file prefix", () => {
            const objectName = "folder/";
            const statements: S3BucketPolicy["Statement"] = [
                {
                    Action: ["s3:ListBucket"],
                    Condition: {
                        StringLike: {
                            "s3:prefix": ["folder/*", "file.txt"]
                        }
                    },
                    Effect: "Allow",
                    Principal: { AWS: ["*"] },
                    Resource: [bucketArn]
                }
            ];

            const expected = [
                {
                    ...statements[0],
                    Condition: {
                        StringLike: {
                            "s3:prefix": ["file.txt"]
                        }
                    }
                }
            ];

            expect(
                removeObjectNameFromListBucketCondition(statements, bucketArn, objectName)
            ).toStrictEqual(expected);
        });
    });

    describe("Edge cases", () => {
        it("returns empty when input is empty", () => {
            expect(
                removeObjectNameFromListBucketCondition([], bucketArn, "objectName")
            ).toStrictEqual([]);
        });

        it("returns unchanged when bucket ARN does not match", () => {
            const statements: S3BucketPolicy["Statement"] = [
                {
                    Action: ["s3:ListBucket"],
                    Condition: {
                        StringLike: {
                            "s3:prefix": ["objectName"]
                        }
                    },
                    Effect: "Allow",
                    Principal: { AWS: ["*"] },
                    Resource: ["otherBucketArn"]
                }
            ];

            expect(
                removeObjectNameFromListBucketCondition(
                    statements,
                    bucketArn,
                    "objectName"
                )
            ).toStrictEqual(statements);
        });

        it("keeps statement if unrelated condition type used", () => {
            const objectName = "objectName";
            const statements: S3BucketPolicy["Statement"] = [
                {
                    Action: ["s3:ListBucket"],
                    Condition: {
                        StringNotEquals: {
                            "s3:prefix": [objectName]
                        }
                    },
                    Effect: "Allow",
                    Principal: { AWS: ["*"] },
                    Resource: [bucketArn]
                }
            ];

            expect(
                removeObjectNameFromListBucketCondition(statements, bucketArn, objectName)
            ).toStrictEqual(statements);
        });
    });
});

describe(symToStr({ addObjectNameToListBucketCondition }), () => {
    const bucketArn = "arn:aws:s3:::my-bucket";

    it("adds a StringLike condition when none exist", () => {
        const result = addObjectNameToListBucketCondition(null, bucketArn, "file.txt");

        const expected: S3BucketPolicy["Statement"] = [
            {
                Effect: "Allow",
                Principal: { AWS: ["*"] },
                Action: ["s3:ListBucket"],
                Resource: [bucketArn],
                Condition: {
                    StringLike: {
                        "s3:prefix": ["file.txt"]
                    }
                }
            }
        ];

        expect(result).toStrictEqual(expected);
    });

    it("adds a StringLike condition when objectName ends with '/'", () => {
        const result = addObjectNameToListBucketCondition(null, bucketArn, "folder/");

        const expected: S3BucketPolicy["Statement"] = [
            {
                Effect: "Allow",
                Principal: { AWS: ["*"] },
                Action: ["s3:ListBucket"],
                Resource: [bucketArn],
                Condition: {
                    StringLike: {
                        "s3:prefix": ["folder/*"]
                    }
                }
            }
        ];

        expect(result).toStrictEqual(expected);
    });

    it("adds new prefix to existing StringLike array", () => {
        const statements: S3BucketPolicy["Statement"] = [
            {
                Effect: "Allow",
                Principal: { AWS: ["*"] },
                Action: ["s3:ListBucket"],
                Resource: [bucketArn],
                Condition: {
                    StringLike: {
                        "s3:prefix": ["file1.txt"]
                    }
                }
            }
        ];

        const result = addObjectNameToListBucketCondition(
            statements,
            bucketArn,
            "file2.txt"
        );

        const expected: S3BucketPolicy["Statement"] = [
            {
                Effect: "Allow",
                Principal: { AWS: ["*"] },
                Action: ["s3:ListBucket"],
                Resource: [bucketArn],
                Condition: {
                    StringLike: {
                        "s3:prefix": ["file1.txt", "file2.txt"]
                    }
                }
            }
        ];

        expect(result).toStrictEqual(expected);
    });

    it("adds new prefix to existing StringLike string", () => {
        const statements: S3BucketPolicy["Statement"] = [
            {
                Effect: "Allow",
                Principal: { AWS: ["*"] },
                Action: ["s3:ListBucket"],
                Resource: [bucketArn],
                Condition: {
                    StringLike: {
                        "s3:prefix": "file1.txt"
                    }
                }
            }
        ];

        const result = addObjectNameToListBucketCondition(
            statements,
            bucketArn,
            "file2.txt"
        );

        const expected: S3BucketPolicy["Statement"] = [
            {
                Effect: "Allow",
                Principal: { AWS: ["*"] },
                Action: ["s3:ListBucket"],
                Resource: [bucketArn],
                Condition: {
                    StringLike: {
                        "s3:prefix": ["file1.txt", "file2.txt"]
                    }
                }
            }
        ];

        expect(result).toStrictEqual(expected);
    });

    it("updates StringLike without affecting existing StringLike", () => {
        const statements: S3BucketPolicy["Statement"] = [
            {
                Effect: "Allow",
                Principal: { AWS: ["*"] },
                Action: ["s3:ListBucket"],
                Resource: [bucketArn],
                Condition: {
                    StringLike: {
                        "s3:prefix": ["file.txt"]
                    }
                }
            }
        ];

        const result = addObjectNameToListBucketCondition(statements, bucketArn, "dir/");

        const expected: S3BucketPolicy["Statement"] = [
            {
                Effect: "Allow",
                Principal: { AWS: ["*"] },
                Action: ["s3:ListBucket"],
                Resource: [bucketArn],
                Condition: {
                    StringLike: {
                        "s3:prefix": ["file.txt", "dir/*"]
                    }
                }
            }
        ];

        expect(result).toStrictEqual(expected);
    });

    it("does not duplicate existing prefix", () => {
        const statements: S3BucketPolicy["Statement"] = [
            {
                Effect: "Allow",
                Principal: { AWS: ["*"] },
                Action: ["s3:ListBucket"],
                Resource: [bucketArn],
                Condition: {
                    StringLike: {
                        "s3:prefix": ["file.txt"]
                    }
                }
            }
        ];

        const result = addObjectNameToListBucketCondition(
            statements,
            bucketArn,
            "file.txt"
        );

        const expected: S3BucketPolicy["Statement"] = [...statements];

        expect(result).toStrictEqual(expected);
    });

    it("does not duplicate existing prefix for directory", () => {
        const statements: S3BucketPolicy["Statement"] = [
            {
                Effect: "Allow",
                Principal: { AWS: ["*"] },
                Action: ["s3:ListBucket"],
                Resource: [bucketArn],
                Condition: {
                    StringLike: {
                        "s3:prefix": ["file/*"]
                    }
                }
            }
        ];

        const result = addObjectNameToListBucketCondition(statements, bucketArn, "file/");

        const expected: S3BucketPolicy["Statement"] = [...statements];

        expect(result).toStrictEqual(expected);
    });

    it("adds new statement if no ListBucket action is found", () => {
        const statements: S3BucketPolicy["Statement"] = [
            {
                Effect: "Allow",
                Principal: { AWS: ["*"] },
                Action: ["s3:GetObject"],
                Resource: ["arn:aws:s3:::my-bucket/file.txt"]
            }
        ];

        const result = addObjectNameToListBucketCondition(
            statements,
            bucketArn,
            "file.txt"
        );

        const expected: S3BucketPolicy["Statement"] = [
            ...statements,
            {
                Effect: "Allow",
                Principal: { AWS: ["*"] },
                Action: ["s3:ListBucket"],
                Resource: [bucketArn],
                Condition: {
                    StringLike: {
                        "s3:prefix": ["file.txt"]
                    }
                }
            }
        ];

        expect(result).toStrictEqual(expected);
    });
});
