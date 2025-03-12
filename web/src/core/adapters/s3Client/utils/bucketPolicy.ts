import { S3BucketPolicy } from "core/ports/S3Client";

// Adds `objectName` to the `s3:prefix` condition in the `s3:ListBucket` statement
export const addObjectNameToListBucketCondition = (
    statements: S3BucketPolicy["Statement"],
    bucketArn: string,
    objectName: string
): S3BucketPolicy["Statement"] => {
    if (statements === null) {
        return [
            {
                Effect: "Allow",
                Principal: { AWS: ["*"] },
                Action: ["s3:ListBucket"],
                Resource: [bucketArn],
                Condition: {
                    StringEquals: {
                        "s3:prefix": [objectName]
                    }
                }
            }
        ];
    }

    const listBucketStatementIndex = statements.findIndex(
        statement =>
            statement.Action.includes("s3:ListBucket") &&
            statement.Resource.includes(bucketArn)
    );

    // If no statements exist or s3:ListBucket is not found, add a new statement
    if (listBucketStatementIndex === -1) {
        return [
            ...statements,
            {
                Effect: "Allow",
                Principal: { AWS: ["*"] },
                Action: ["s3:ListBucket"],
                Resource: [bucketArn],
                Condition: {
                    StringEquals: {
                        "s3:prefix": [objectName]
                    }
                }
            }
        ];
    }

    // Update existing s3:ListBucket statement
    const listBucketStatement = statements[listBucketStatementIndex];
    const updatedPrefixCondition = listBucketStatement.Condition?.StringEquals?.[
        "s3:prefix"
    ]
        ? Array.isArray(listBucketStatement.Condition.StringEquals["s3:prefix"])
            ? [
                  ...new Set([
                      ...listBucketStatement.Condition.StringEquals["s3:prefix"],
                      objectName
                  ])
              ]
            : [listBucketStatement.Condition.StringEquals["s3:prefix"], objectName]
        : [objectName];

    // Return new statements array with updated s3:ListBucket statement
    return statements.map((statement, index) =>
        index === listBucketStatementIndex
            ? {
                  ...statement,
                  Condition: {
                      ...statement.Condition,
                      StringEquals: {
                          ...statement.Condition?.StringEquals,
                          "s3:prefix": updatedPrefixCondition
                      }
                  }
              }
            : statement
    );
};

// Removes `objectName` from the `s3:prefix` condition in the `s3:ListBucket` statement
export const removeObjectNameFromListBucketCondition = (
    statements: S3BucketPolicy["Statement"],
    bucketArn: string,
    objectName: string
) => {
    if (statements === null) {
        return null;
    }

    return statements
        .map(statement => {
            if (
                statement.Action.includes("s3:ListBucket") &&
                statement.Resource.includes(bucketArn)
            ) {
                const updatedPrefixCondition: string[] =
                    statement.Condition?.StringEquals?.["s3:prefix"]?.filter(
                        (prefix: string) => prefix !== objectName
                    );

                if (updatedPrefixCondition.length > 0) {
                    return {
                        ...statement,
                        Condition: {
                            ...statement.Condition,
                            StringEquals: {
                                ...statement.Condition?.StringEquals,
                                "s3:prefix": updatedPrefixCondition
                            }
                        }
                    };
                }

                const updatedStringEquals = removeKey(
                    statement.Condition?.StringEquals,
                    "s3:prefix"
                );

                // If "StringEquals" is still valid, return updated statement
                if (updatedStringEquals) {
                    return {
                        ...statement,
                        Condition: {
                            ...statement.Condition,
                            StringEquals: updatedStringEquals
                        }
                    };
                }

                // Remove "StringEquals" from Condition
                const updatedCondition = removeKey(statement.Condition, "StringEquals");

                // If Condition is still valid, return updated statement
                return updatedCondition
                    ? { ...statement, Condition: updatedCondition }
                    : undefined;
            }
            return statement;
        })
        .filter(statement => statement !== undefined);
};

// Adds a new `s3:GetObject` statement for `resourceArn`
export const addResourceArnInGetObjectStatement = (
    statements: S3BucketPolicy["Statement"],
    resourceArn: string
): S3BucketPolicy["Statement"] => {
    if (statements === null) {
        return [
            {
                Effect: "Allow",
                Principal: { AWS: ["*"] },
                Action: ["s3:GetObject"],
                Resource: [resourceArn]
            }
        ];
    }

    const existingStatementIndex = statements.findIndex(statement =>
        Array.isArray(statement.Action)
            ? statement.Action.includes("s3:GetObject")
            : statement.Action === "s3:GetObject"
    );

    if (existingStatementIndex === -1) {
        return [
            ...statements,
            {
                Effect: "Allow",
                Principal: { AWS: ["*"] },
                Action: ["s3:GetObject"],
                Resource: [resourceArn]
            }
        ];
    }

    return statements.map((statement, index) =>
        index === existingStatementIndex
            ? {
                  ...statement,
                  Resource: Array.from(new Set([...statement.Resource, resourceArn])) // Avoid duplicate ARNs
              }
            : statement
    );
};

export const removeResourceArnInGetObjectStatement = (
    statements: S3BucketPolicy["Statement"],
    resourceArn: string
): S3BucketPolicy["Statement"] => {
    if (statements === null) {
        return null;
    }
    const existingStatementIndex = statements.findIndex(
        statement =>
            (Array.isArray(statement.Action)
                ? statement.Action.includes("s3:GetObject")
                : statement.Action === "s3:GetObject") &&
            statement.Resource.includes(resourceArn)
    );

    if (existingStatementIndex === -1) {
        return statements;
    }

    const existingStatement = statements[existingStatementIndex];
    const updatedResources = existingStatement.Resource.filter(
        arn => arn !== resourceArn
    );

    return updatedResources.length > 0
        ? statements.map((statement, index) =>
              index === existingStatementIndex
                  ? { ...statement, Resource: updatedResources }
                  : statement
          )
        : statements.filter((_, index) => index !== existingStatementIndex);
};

const removeKey = <T extends Record<string, any>, K extends keyof T>(
    obj: T | undefined,
    key: K
): Omit<T, K> | undefined => {
    if (!obj || !(key in obj)) {
        return obj;
    }

    const { [key]: _, ...rest } = obj;
    return Object.keys(rest).length > 0 ? rest : undefined;
};
