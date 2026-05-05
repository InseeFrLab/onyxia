import { getS3UriKey } from "core/tools/S3Uri";
import type { S3Uri } from "core/tools/S3Uri";
import { fnv1aHashToHex } from "core/tools/fnv1aHashToHex";
import { assert } from "tsafe/assert";

export type BucketPolicies = Record<string, unknown>;

type BucketPoliciesByBucket = Record<
    string,
    { bucketPolicies: BucketPolicies | undefined } | undefined
>;

const SID_PREFIX = "Onyxia";
const MANAGED_SID_PREFIX = `${SID_PREFIX}MakePrefixPublic`;
const GET_OBJECT_SID_PREFIX = `${MANAGED_SID_PREFIX}GetObject`;
const LIST_BUCKET_SID_PREFIX = `${MANAGED_SID_PREFIX}ListBucket`;

const ACTION_GET_OBJECT = "s3:GetObject";
const ACTION_LIST_BUCKET = "s3:ListBucket";

const AWS_POLICY_VERSION = "2012-10-17";

type PolicyStatement = Record<string, unknown>;

type ManagedStatement =
    | {
          kind: "getObject";
          prefixKey: string;
      }
    | {
          kind: "listBucket";
          prefixKey: string;
      };

export function getHasPrefixBeMadePublic(params: {
    s3Uri: S3Uri.TerminatedByDelimiter;
    bucketPoliciesByBucket: BucketPoliciesByBucket;
}): boolean {
    const { s3Uri, bucketPoliciesByBucket } = params;

    const bucketPolicies = getBucketPolicies({ s3Uri, bucketPoliciesByBucket });

    if (bucketPolicies === undefined) {
        return false;
    }

    const prefixKey = getS3UriKey(s3Uri);

    return getManagedPublicPrefixKeys({
        bucket: s3Uri.bucket,
        bucketPolicies
    }).includes(prefixKey);
}

export function getIsWithinPrefixThatHasBeenMadePublic(params: {
    s3Uri: S3Uri;
    bucketPoliciesByBucket: BucketPoliciesByBucket;
}): boolean {
    const { s3Uri, bucketPoliciesByBucket } = params;

    const bucketPolicies = getBucketPolicies({ s3Uri, bucketPoliciesByBucket });

    if (bucketPolicies === undefined) {
        return false;
    }

    const s3UriKey = getS3UriKey(s3Uri);

    return getManagedPublicPrefixKeys({
        bucket: s3Uri.bucket,
        bucketPolicies
    }).some(prefixKey => s3UriKey.startsWith(prefixKey));
}

export function makePrefixPublic(params: {
    s3Uri: S3Uri.TerminatedByDelimiter;
    bucketPoliciesByBucket: BucketPoliciesByBucket;
}): {
    bucket: string;
    updatedBucketPolicies: BucketPolicies;
    awsS3CliEmulatedCommand: { cmd: string; resp: string };
} {
    const { s3Uri, bucketPoliciesByBucket } = params;

    const bucketPolicies = getBucketPolicies({ s3Uri, bucketPoliciesByBucket });

    assert(bucketPolicies !== undefined);

    const prefixKey = getS3UriKey(s3Uri);

    const statements = getPolicyStatements(bucketPolicies);

    const updatedBucketPolicies = {
        ...bucketPolicies,
        Version:
            typeof bucketPolicies.Version === "string"
                ? bucketPolicies.Version
                : AWS_POLICY_VERSION,
        Statement: [
            ...statements.filter(
                statement =>
                    !getShouldRemoveManagedStatementForPrefix({
                        bucket: s3Uri.bucket,
                        prefixKey,
                        statement
                    })
            ),
            createGetObjectStatement({ bucket: s3Uri.bucket, prefixKey }),
            createListBucketStatement({ bucket: s3Uri.bucket, prefixKey })
        ]
    };

    return {
        bucket: s3Uri.bucket,
        updatedBucketPolicies,
        awsS3CliEmulatedCommand: createAwsS3CliEmulatedCommand({
            bucket: s3Uri.bucket,
            updatedBucketPolicies
        })
    };
}

export function undoMakePrefixPublic(params: {
    s3Uri: S3Uri.TerminatedByDelimiter;
    bucketPoliciesByBucket: BucketPoliciesByBucket;
}): {
    bucket: string;
    updatedBucketPolicies: BucketPolicies;
    awsS3CliEmulatedCommand: { cmd: string; resp: string };
} {
    const { s3Uri, bucketPoliciesByBucket } = params;

    const bucketPolicies = getBucketPolicies({ s3Uri, bucketPoliciesByBucket });

    assert(bucketPolicies !== undefined);

    const prefixKey = getS3UriKey(s3Uri);

    const statements = getPolicyStatements(bucketPolicies);

    const updatedStatements = statements.filter(
        statement =>
            !getShouldRemoveManagedStatementForPrefix({
                bucket: s3Uri.bucket,
                prefixKey,
                statement
            })
    );

    const updatedBucketPolicies =
        updatedStatements.length === statements.length
            ? bucketPolicies
            : {
                  ...bucketPolicies,
                  Statement: updatedStatements
              };

    return {
        bucket: s3Uri.bucket,
        updatedBucketPolicies,
        awsS3CliEmulatedCommand: createAwsS3CliEmulatedCommand({
            bucket: s3Uri.bucket,
            updatedBucketPolicies
        })
    };
}

function getBucketPolicies(params: {
    s3Uri: S3Uri;
    bucketPoliciesByBucket: BucketPoliciesByBucket;
}): BucketPolicies | undefined {
    const { s3Uri, bucketPoliciesByBucket } = params;

    return bucketPoliciesByBucket[s3Uri.bucket]?.bucketPolicies;
}

function getManagedPublicPrefixKeys(params: {
    bucket: string;
    bucketPolicies: BucketPolicies;
}): string[] {
    const { bucket, bucketPolicies } = params;

    const managedStatementByPrefixKey = new Map<
        string,
        { hasGetObject: boolean; hasListBucket: boolean }
    >();

    for (const statement of getPolicyStatements(bucketPolicies)) {
        const managedStatement = parseManagedStatement({ bucket, statement });

        if (managedStatement === undefined) {
            continue;
        }

        let managedStatements = managedStatementByPrefixKey.get(
            managedStatement.prefixKey
        );

        if (managedStatements === undefined) {
            managedStatements = {
                hasGetObject: false,
                hasListBucket: false
            };

            managedStatementByPrefixKey.set(
                managedStatement.prefixKey,
                managedStatements
            );
        }

        switch (managedStatement.kind) {
            case "getObject":
                managedStatements.hasGetObject = true;
                break;
            case "listBucket":
                managedStatements.hasListBucket = true;
                break;
        }
    }

    return Array.from(managedStatementByPrefixKey.entries())
        .filter(([, { hasGetObject, hasListBucket }]) => hasGetObject && hasListBucket)
        .map(([prefixKey]) => prefixKey);
}

function getPolicyStatements(bucketPolicies: BucketPolicies): unknown[] {
    const { Statement: statement } = bucketPolicies;

    if (Array.isArray(statement)) {
        return statement;
    }

    if (statement === undefined) {
        return [];
    }

    return [statement];
}

function parseManagedStatement(params: {
    bucket: string;
    statement: unknown;
}): ManagedStatement | undefined {
    const { bucket, statement } = params;

    if (!isRecord(statement)) {
        return undefined;
    }

    const sid = statement.Sid;

    if (typeof sid !== "string") {
        return undefined;
    }

    if (sid.startsWith(GET_OBJECT_SID_PREFIX)) {
        const prefixKey = parseManagedGetObjectStatement({ bucket, statement });

        return prefixKey === undefined
            ? undefined
            : {
                  kind: "getObject",
                  prefixKey
              };
    }

    if (sid.startsWith(LIST_BUCKET_SID_PREFIX)) {
        const prefixKey = parseManagedListBucketStatement({ bucket, statement });

        return prefixKey === undefined
            ? undefined
            : {
                  kind: "listBucket",
                  prefixKey
              };
    }

    return undefined;
}

function parseManagedGetObjectStatement(params: {
    bucket: string;
    statement: PolicyStatement;
}): string | undefined {
    const { bucket, statement } = params;

    if (
        statement.Effect !== "Allow" ||
        !hasAnonymousPrincipal(statement.Principal) ||
        !hasAction({ action: statement.Action, expectedAction: ACTION_GET_OBJECT })
    ) {
        return undefined;
    }

    const objectResourceArnPrefix = `arn:aws:s3:::${bucket}/`;

    const objectResourceArn = getStringValues(statement.Resource).find(
        resource => resource.startsWith(objectResourceArnPrefix) && resource.endsWith("*")
    );

    if (objectResourceArn === undefined) {
        return undefined;
    }

    return objectResourceArn.slice(objectResourceArnPrefix.length, -1);
}

function parseManagedListBucketStatement(params: {
    bucket: string;
    statement: PolicyStatement;
}): string | undefined {
    const { bucket, statement } = params;

    if (
        statement.Effect !== "Allow" ||
        !hasAnonymousPrincipal(statement.Principal) ||
        !hasAction({ action: statement.Action, expectedAction: ACTION_LIST_BUCKET }) ||
        !getStringValues(statement.Resource).includes(`arn:aws:s3:::${bucket}`)
    ) {
        return undefined;
    }

    const condition = statement.Condition;

    if (!isRecord(condition)) {
        return undefined;
    }

    const stringLikeCondition = condition.StringLike;

    if (!isRecord(stringLikeCondition)) {
        return undefined;
    }

    const prefixPattern = getStringValues(stringLikeCondition["s3:prefix"]).find(value =>
        value.endsWith("*")
    );

    if (prefixPattern === undefined) {
        return undefined;
    }

    return prefixPattern.slice(0, -1);
}

function createGetObjectStatement(params: {
    bucket: string;
    prefixKey: string;
}): PolicyStatement {
    const { bucket, prefixKey } = params;

    return {
        Sid: getManagedStatementSids({ bucket, prefixKey }).getObject,
        Effect: "Allow",
        Principal: "*",
        Action: ACTION_GET_OBJECT,
        Resource: `arn:aws:s3:::${bucket}/${prefixKey}*`
    };
}

function createListBucketStatement(params: {
    bucket: string;
    prefixKey: string;
}): PolicyStatement {
    const { bucket, prefixKey } = params;

    return {
        Sid: getManagedStatementSids({ bucket, prefixKey }).listBucket,
        Effect: "Allow",
        Principal: "*",
        Action: ACTION_LIST_BUCKET,
        Resource: `arn:aws:s3:::${bucket}`,
        Condition: {
            StringLike: {
                "s3:prefix": `${prefixKey}*`
            }
        }
    };
}

function getShouldRemoveManagedStatementForPrefix(params: {
    bucket: string;
    prefixKey: string;
    statement: unknown;
}): boolean {
    const { bucket, prefixKey, statement } = params;

    if (isRecord(statement)) {
        const sid = statement.Sid;

        if (typeof sid === "string") {
            const { getObject, listBucket } = getManagedStatementSids({
                bucket,
                prefixKey
            });

            if (sid === getObject || sid === listBucket) {
                return true;
            }
        }
    }

    const managedStatement = parseManagedStatement({ bucket, statement });

    return managedStatement?.prefixKey === prefixKey;
}

function getManagedStatementSids(params: { bucket: string; prefixKey: string }): {
    getObject: string;
    listBucket: string;
} {
    const { bucket, prefixKey } = params;

    const ruleId = fnv1aHashToHex(`${bucket}/${prefixKey}`);

    return {
        getObject: `${GET_OBJECT_SID_PREFIX}${ruleId}`,
        listBucket: `${LIST_BUCKET_SID_PREFIX}${ruleId}`
    };
}

function hasAction(params: { action: unknown; expectedAction: string }): boolean {
    const { action, expectedAction } = params;

    return getStringValues(action).includes(expectedAction);
}

function hasAnonymousPrincipal(principal: unknown): boolean {
    if (principal === "*") {
        return true;
    }

    if (!isRecord(principal)) {
        return false;
    }

    return getStringValues(principal.AWS).includes("*");
}

function getStringValues(value: unknown): string[] {
    if (typeof value === "string") {
        return [value];
    }

    if (Array.isArray(value)) {
        return value.filter((item): item is string => typeof item === "string");
    }

    return [];
}

function createAwsS3CliEmulatedCommand(params: {
    bucket: string;
    updatedBucketPolicies: BucketPolicies;
}): { cmd: string; resp: string } {
    const { bucket, updatedBucketPolicies } = params;

    return {
        cmd: `aws s3api put-bucket-policy --bucket ${shellQuote(bucket)} --policy ${shellQuote(JSON.stringify(updatedBucketPolicies))}`,
        resp: ""
    };
}

function shellQuote(value: string): string {
    return `'${value.replace(/'/g, "'\\''")}'`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
