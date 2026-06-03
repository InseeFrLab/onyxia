import { getS3UriKey } from "core/tools/S3Uri";
import type { S3Uri } from "core/tools/S3Uri";
import { assert, type Equals } from "tsafe/assert";
import type { S3Client } from "core/ports/S3Client";

export type BucketPolicies = Record<string, unknown>;

assert<Equals<S3Client.BucketPolicies, BucketPolicies>>;

type BucketPoliciesByBucket = Record<
    string,
    { bucketPolicies: BucketPolicies | undefined } | undefined
>;

const SID_PREFIX = "Onyxia";
const MANAGED_SID_PREFIX = `${SID_PREFIX}MakePrefixPublic`;
const GET_OBJECT_SID = `${MANAGED_SID_PREFIX}GetObject`;
const LIST_BUCKET_SID = `${MANAGED_SID_PREFIX}ListBucket`;

const ACTION_GET_OBJECT = "s3:GetObject";
const ACTION_LIST_BUCKET = "s3:ListBucket";

const AWS_POLICY_VERSION = "2012-10-17";

type PolicyStatement = Record<string, unknown>;

type ManagedStatement =
    | {
          kind: "getObject";
          prefixKeys: string[];
      }
    | {
          kind: "listBucket";
          prefixKeys: string[];
      };

type ManagedPrefixKeysByKind = {
    getObject: string[];
    listBucket: string[];
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
}):
    | {
          isWithinPrefixThatHasBeenMadePublic: true;
          s3Uri_publicPrefix: S3Uri.TerminatedByDelimiter;
      }
    | {
          isWithinPrefixThatHasBeenMadePublic: false;
          s3Uri_publicPrefix?: never;
      } {
    const { s3Uri, bucketPoliciesByBucket } = params;

    const bucketPolicies = getBucketPolicies({ s3Uri, bucketPoliciesByBucket });

    if (bucketPolicies === undefined) {
        return { isWithinPrefixThatHasBeenMadePublic: false };
    }

    const s3UriKey = getS3UriKey(s3Uri);

    const publicPrefixKey = getManagedPublicPrefixKeys({
        bucket: s3Uri.bucket,
        bucketPolicies
    })
        .filter(prefixKey => s3UriKey.startsWith(prefixKey))
        .sort((a, b) => b.length - a.length)[0];

    if (publicPrefixKey === undefined) {
        return { isWithinPrefixThatHasBeenMadePublic: false };
    }

    return {
        isWithinPrefixThatHasBeenMadePublic: true,
        s3Uri_publicPrefix: getS3UriFromPrefixKey({
            s3Uri,
            prefixKey: publicPrefixKey
        })
    };
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

    const managedPrefixKeysByKind = getManagedPrefixKeysByKind({
        bucket: s3Uri.bucket,
        bucketPolicies
    });

    const updatedBucketPolicies = {
        ...bucketPolicies,
        Version:
            typeof bucketPolicies.Version === "string"
                ? bucketPolicies.Version
                : AWS_POLICY_VERSION,
        Statement: [
            ...statements.filter(
                statement =>
                    !getShouldRemoveManagedStatementWhenRebuilding({
                        bucket: s3Uri.bucket,
                        statement
                    })
            ),
            ...createManagedStatements({
                bucket: s3Uri.bucket,
                prefixKeysByKind: {
                    getObject: removePrefixKeysWithinHigherLevelPrefix(
                        appendUnique(managedPrefixKeysByKind.getObject, prefixKey)
                    ),
                    listBucket: removePrefixKeysWithinHigherLevelPrefix(
                        appendUnique(managedPrefixKeysByKind.listBucket, prefixKey)
                    )
                }
            })
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

    const managedPrefixKeysByKind = getManagedPrefixKeysByKind({
        bucket: s3Uri.bucket,
        bucketPolicies
    });

    const hasManagedPrefixKey =
        managedPrefixKeysByKind.getObject.includes(prefixKey) ||
        managedPrefixKeysByKind.listBucket.includes(prefixKey);

    const updatedBucketPolicies = !hasManagedPrefixKey
        ? bucketPolicies
        : {
              ...bucketPolicies,
              Statement: [
                  ...statements.filter(
                      statement =>
                          !getShouldRemoveManagedStatementWhenRebuilding({
                              bucket: s3Uri.bucket,
                              statement
                          })
                  ),
                  ...createManagedStatements({
                      bucket: s3Uri.bucket,
                      prefixKeysByKind: {
                          getObject: managedPrefixKeysByKind.getObject.filter(
                              value => value !== prefixKey
                          ),
                          listBucket: managedPrefixKeysByKind.listBucket.filter(
                              value => value !== prefixKey
                          )
                      }
                  })
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

    const { getObject, listBucket } = getManagedPrefixKeysByKind({
        bucket,
        bucketPolicies
    });

    return getObject.filter(prefixKey => listBucket.includes(prefixKey));
}

function getS3UriFromPrefixKey(params: {
    s3Uri: S3Uri;
    prefixKey: string;
}): S3Uri.TerminatedByDelimiter {
    const { s3Uri, prefixKey } = params;

    const keyWithoutTrailingDelimiter = prefixKey.endsWith(s3Uri.delimiter)
        ? prefixKey.slice(0, -s3Uri.delimiter.length)
        : prefixKey;

    return {
        bucket: s3Uri.bucket,
        delimiter: s3Uri.delimiter,
        keySegments:
            keyWithoutTrailingDelimiter === ""
                ? []
                : keyWithoutTrailingDelimiter.split(s3Uri.delimiter),
        isDelimiterTerminated: true
    };
}

function getManagedPrefixKeysByKind(params: {
    bucket: string;
    bucketPolicies: BucketPolicies;
}): ManagedPrefixKeysByKind {
    const { bucket, bucketPolicies } = params;

    const managedPrefixKeysByKind: ManagedPrefixKeysByKind = {
        getObject: [],
        listBucket: []
    };

    for (const statement of getPolicyStatements(bucketPolicies)) {
        const managedStatement = parseManagedStatement({ bucket, statement });

        if (managedStatement === undefined) {
            continue;
        }

        for (const prefixKey of managedStatement.prefixKeys) {
            managedPrefixKeysByKind[managedStatement.kind] = appendUnique(
                managedPrefixKeysByKind[managedStatement.kind],
                prefixKey
            );
        }
    }

    return managedPrefixKeysByKind;
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

    if (sid.startsWith(GET_OBJECT_SID)) {
        const prefixKeys = parseManagedGetObjectStatement({ bucket, statement });

        return prefixKeys.length === 0
            ? undefined
            : {
                  kind: "getObject",
                  prefixKeys
              };
    }

    if (sid.startsWith(LIST_BUCKET_SID)) {
        const prefixKeys = parseManagedListBucketStatement({ bucket, statement });

        return prefixKeys.length === 0
            ? undefined
            : {
                  kind: "listBucket",
                  prefixKeys
              };
    }

    return undefined;
}

function parseManagedGetObjectStatement(params: {
    bucket: string;
    statement: PolicyStatement;
}): string[] {
    const { bucket, statement } = params;

    if (
        statement.Effect !== "Allow" ||
        !hasAnonymousPrincipal(statement.Principal) ||
        !hasAction({ action: statement.Action, expectedAction: ACTION_GET_OBJECT })
    ) {
        return [];
    }

    const objectResourceArnPrefix = `arn:aws:s3:::${bucket}/`;

    return getUniqueValues(
        getStringValues(statement.Resource)
            .filter(
                resource =>
                    resource.startsWith(objectResourceArnPrefix) && resource.endsWith("*")
            )
            .map(resource => resource.slice(objectResourceArnPrefix.length, -1))
    );
}

function parseManagedListBucketStatement(params: {
    bucket: string;
    statement: PolicyStatement;
}): string[] {
    const { bucket, statement } = params;

    if (
        statement.Effect !== "Allow" ||
        !hasAnonymousPrincipal(statement.Principal) ||
        !hasAction({ action: statement.Action, expectedAction: ACTION_LIST_BUCKET }) ||
        !getStringValues(statement.Resource).includes(`arn:aws:s3:::${bucket}`)
    ) {
        return [];
    }

    const condition = statement.Condition;

    if (!isRecord(condition)) {
        return [];
    }

    const stringLikeCondition = condition.StringLike;

    if (!isRecord(stringLikeCondition)) {
        return [];
    }

    return getUniqueValues(
        getStringValues(stringLikeCondition["s3:prefix"])
            .filter(value => value.endsWith("*"))
            .map(value => value.slice(0, -1))
    );
}

function createManagedStatements(params: {
    bucket: string;
    prefixKeysByKind: ManagedPrefixKeysByKind;
}): PolicyStatement[] {
    const { bucket, prefixKeysByKind } = params;

    return [
        ...(prefixKeysByKind.getObject.length === 0
            ? []
            : [
                  createGetObjectStatement({
                      bucket,
                      prefixKeys: prefixKeysByKind.getObject
                  })
              ]),
        ...(prefixKeysByKind.listBucket.length === 0
            ? []
            : [
                  createListBucketStatement({
                      bucket,
                      prefixKeys: prefixKeysByKind.listBucket
                  })
              ])
    ];
}

function createGetObjectStatement(params: {
    bucket: string;
    prefixKeys: string[];
}): PolicyStatement {
    const { bucket, prefixKeys } = params;

    return {
        Sid: GET_OBJECT_SID,
        Effect: "Allow",
        Principal: "*",
        Action: ACTION_GET_OBJECT,
        Resource: prefixKeys.map(prefixKey => `arn:aws:s3:::${bucket}/${prefixKey}*`)
    };
}

function createListBucketStatement(params: {
    bucket: string;
    prefixKeys: string[];
}): PolicyStatement {
    const { bucket, prefixKeys } = params;

    return {
        Sid: LIST_BUCKET_SID,
        Effect: "Allow",
        Principal: "*",
        Action: ACTION_LIST_BUCKET,
        Resource: `arn:aws:s3:::${bucket}`,
        Condition: {
            StringLike: {
                "s3:prefix": prefixKeys.map(prefixKey => `${prefixKey}*`)
            }
        }
    };
}

function getShouldRemoveManagedStatementWhenRebuilding(params: {
    bucket: string;
    statement: unknown;
}): boolean {
    const { bucket, statement } = params;

    if (isRecord(statement)) {
        const sid = statement.Sid;

        if (sid === GET_OBJECT_SID || sid === LIST_BUCKET_SID) {
            return true;
        }
    }

    return parseManagedStatement({ bucket, statement }) !== undefined;
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

function appendUnique(values: string[], value: string): string[] {
    return values.includes(value) ? values : [...values, value];
}

function getUniqueValues(values: string[]): string[] {
    return values.reduce(appendUnique, []);
}

function removePrefixKeysWithinHigherLevelPrefix(prefixKeys: string[]): string[] {
    const uniquePrefixKeys = getUniqueValues(prefixKeys);

    return uniquePrefixKeys.filter(
        prefixKey =>
            !uniquePrefixKeys.some(
                higherLevelPrefixKey =>
                    higherLevelPrefixKey !== prefixKey &&
                    prefixKey.startsWith(higherLevelPrefixKey)
            )
    );
}

function createAwsS3CliEmulatedCommand(params: {
    bucket: string;
    updatedBucketPolicies: BucketPolicies;
}): { cmd: string; resp: string } {
    const { bucket, updatedBucketPolicies } = params;

    const formattedBucketPolicies = JSON.stringify(updatedBucketPolicies, null, 2);

    return {
        cmd: [
            "aws s3api put-bucket-policy \\",
            `  --bucket ${shellQuote(bucket)} \\`,
            `  --policy ${shellQuote(formattedBucketPolicies)}`
        ].join("\n"),
        resp: ""
    };
}

function shellQuote(value: string): string {
    return `'${value.replace(/'/g, "'\\''")}'`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
