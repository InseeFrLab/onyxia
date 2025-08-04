import type { S3BucketPolicy } from "core/ports/S3Client";

// Adds `objectName` to the `s3:prefix` condition in the `s3:ListBucket` statement
export const addObjectNameToListBucketCondition = (
    statements: S3BucketPolicy["Statement"],
    bucketArn: string,
    objectName: string
): S3BucketPolicy["Statement"] => {
    const { conditionKey, objectPrefix } = getConditionKeyAndPrefix(objectName);

    if (statements === null) {
        return [
            {
                Effect: "Allow",
                Principal: { AWS: ["*"] },
                Action: ["s3:ListBucket"],
                Resource: [bucketArn],
                Condition: {
                    [conditionKey]: {
                        "s3:prefix": [objectPrefix]
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
                    [conditionKey]: {
                        "s3:prefix": [objectPrefix]
                    }
                }
            }
        ];
    }

    const statement = statements[listBucketStatementIndex];
    const updatedStatement = { ...statement };

    // Get existing "s3:prefix" array (or string) for the correct condition key
    const existingCondition = updatedStatement.Condition?.[conditionKey];
    const existingPrefixesRaw = existingCondition?.["s3:prefix"];

    const existingPrefixes: string[] = existingPrefixesRaw
        ? Array.isArray(existingPrefixesRaw)
            ? existingPrefixesRaw
            : [existingPrefixesRaw]
        : [];

    const newPrefixes = Array.from(new Set([...existingPrefixes, objectPrefix]));

    return statements.map((s, i) =>
        i === listBucketStatementIndex
            ? {
                  ...s,
                  Condition: {
                      ...s.Condition,
                      [conditionKey]: {
                          ...s.Condition?.[conditionKey],
                          "s3:prefix": newPrefixes
                      }
                  }
              }
            : s
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

    const { conditionKey, objectPrefix } = getConditionKeyAndPrefix(objectName);

    return statements
        .map(statement => {
            if (
                statement.Action.includes("s3:ListBucket") &&
                statement.Resource.includes(bucketArn)
            ) {
                const updatedPrefixCondition: string[] =
                    statement.Condition?.[conditionKey]?.["s3:prefix"]?.filter(
                        (prefix: string) => prefix !== objectPrefix
                    ) ?? [];

                if (updatedPrefixCondition.length > 0) {
                    return {
                        ...statement,
                        Condition: {
                            ...statement.Condition,
                            [conditionKey]: {
                                ...statement.Condition?.[conditionKey],
                                "s3:prefix": updatedPrefixCondition
                            }
                        }
                    };
                }

                const updatedStringEquals = removeKey(
                    statement.Condition?.[conditionKey],
                    "s3:prefix"
                );

                // If "conditionKey" is still valid, return updated statement
                if (updatedStringEquals) {
                    return {
                        ...statement,
                        Condition: {
                            ...statement.Condition,
                            [conditionKey]: updatedStringEquals
                        }
                    };
                }

                // Remove "conditionKey" from Condition
                const updatedCondition = removeKey(statement.Condition, conditionKey);

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

function getConditionKeyAndPrefix(objectName: string): {
    conditionKey: "StringLike";
    objectPrefix: string;
} {
    if (objectName.endsWith("/")) {
        return {
            conditionKey: "StringLike",
            objectPrefix: `${objectName}*`
        };
    }

    return {
        conditionKey: "StringLike",
        objectPrefix: objectName
    };
}
