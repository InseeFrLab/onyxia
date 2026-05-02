import { getS3UriKey, type S3Uri } from "core/tools/S3Uri";
import type { S3Client } from "core/ports/S3Client";
import { fnv1aHashToHex } from "core/tools/fnv1aHashToHex";

type BucketPolicyStatement = {
    Effect?: unknown;
    Sid?: unknown;
    Principal?: unknown;
    Action?: unknown;
    Resource?: unknown;
    Condition?: unknown;
};

type ManagedBucketPolicyStatement = Record<string, unknown>;

export function getIsPublic(params: {
    s3Uri: S3Uri;
    bucketPolicyByBucket: Record<
        string,
        { bucketPolicies: S3Client.BucketPolicies | undefined } | undefined
    >;
}): boolean | undefined {
    const { s3Uri, bucketPolicyByBucket } = params;

    const bucketPolicies = bucketPolicyByBucket[s3Uri.bucket]?.bucketPolicies;

    if (bucketPolicies === undefined) {
        return undefined;
    }

    const statements = getStatements(bucketPolicies);

    const matchingPublicStatements = statements.filter(statement =>
        getDoesStatementApplyToPublicGetObject({ statement, s3Uri })
    );

    if (
        matchingPublicStatements.some(statement =>
            getDoesEffectMatch({ statement, effect: "Deny" })
        )
    ) {
        return false;
    }

    return matchingPublicStatements.some(statement =>
        getDoesEffectMatch({ statement, effect: "Allow" })
    );
}

export function getSetS3UriPublicPrivatePolicyCommandLog(params: {
    s3Uri: S3Uri;
    bucketPolicies: S3Client.BucketPolicies;
    policy: "public" | "private";
}): { cmd: string; successResp: string } {
    const { s3Uri, bucketPolicies, policy } = params;

    const resourceArn = getPublicReadResourceArn(s3Uri);

    const statements = removeManagedPublicReadStatement({
        statements: getRawStatements(bucketPolicies),
        resourceArn
    });

    if (policy === "public") {
        statements.push(createPublicReadStatement({ resourceArn }));
    }

    if (statements.length === 0) {
        return {
            cmd: `aws s3api delete-bucket-policy --bucket ${s3Uri.bucket}`,
            successResp: "Bucket policy deleted"
        };
    }

    const nextBucketPolicies = {
        ...bucketPolicies,
        Statement: statements
    };

    return {
        cmd: `aws s3api put-bucket-policy --bucket ${
            s3Uri.bucket
        } --policy '${JSON.stringify(nextBucketPolicies)}'`,
        successResp: "Bucket policy updated"
    };
}

function getStatements(bucketPolicies: S3Client.BucketPolicies): BucketPolicyStatement[] {
    const { Statement } = bucketPolicies;

    if (isRecord(Statement)) {
        return [Statement];
    }

    if (Array.isArray(Statement)) {
        return Statement.filter(isRecord);
    }

    return [];
}

function getRawStatements(bucketPolicies: S3Client.BucketPolicies): unknown[] {
    const { Statement } = bucketPolicies;

    if (Array.isArray(Statement)) {
        return Statement;
    }

    if (Statement === undefined) {
        return [];
    }

    return [Statement];
}

function getPublicReadStatementSid(resourceArn: string): string {
    return `OnyxiaPublicRead${fnv1aHashToHex(resourceArn)}`;
}

function getPublicReadResourceArn(s3Uri: S3Uri): string {
    const key = getS3UriKey(s3Uri);

    if (key === "") {
        return `arn:aws:s3:::${s3Uri.bucket}/*`;
    }

    return `arn:aws:s3:::${s3Uri.bucket}/${key}${s3Uri.isDelimiterTerminated ? "*" : ""}`;
}

function createPublicReadStatement(params: {
    resourceArn: string;
}): ManagedBucketPolicyStatement {
    const { resourceArn } = params;

    return {
        Sid: getPublicReadStatementSid(resourceArn),
        Effect: "Allow",
        Principal: "*",
        Action: "s3:GetObject",
        Resource: resourceArn
    };
}

function removeManagedPublicReadStatement(params: {
    statements: unknown[];
    resourceArn: string;
}): unknown[] {
    const { statements, resourceArn } = params;

    const sid = getPublicReadStatementSid(resourceArn);

    return statements.filter(statement => {
        if (!isRecord(statement)) {
            return true;
        }

        return statement.Sid !== sid || statement.Resource !== resourceArn;
    });
}

function getDoesStatementApplyToPublicGetObject(params: {
    statement: BucketPolicyStatement;
    s3Uri: S3Uri;
}): boolean {
    const { statement, s3Uri } = params;

    if (!getIsPublicPrincipal(statement.Principal)) {
        return false;
    }

    if (!getDoesActionMatchGetObject(statement.Action)) {
        return false;
    }

    if (!getDoesResourceMatchS3Uri({ resource: statement.Resource, s3Uri })) {
        return false;
    }

    return getDoesConditionMatch({
        condition: statement.Condition,
        effect: typeof statement.Effect === "string" ? statement.Effect : undefined
    });
}

function getDoesEffectMatch(params: {
    statement: BucketPolicyStatement;
    effect: "Allow" | "Deny";
}): boolean {
    const { statement, effect } = params;

    return statement.Effect === effect;
}

function getIsPublicPrincipal(principal: unknown): boolean {
    if (principal === "*") {
        return true;
    }

    if (!isRecord(principal)) {
        return false;
    }

    return getValues(principal.AWS).includes("*");
}

function getDoesActionMatchGetObject(action: unknown): boolean {
    return getValues(action).some(action => {
        const pattern = action.toLowerCase();

        return getWildcardRegExp(pattern).test("s3:getobject");
    });
}

function getDoesResourceMatchS3Uri(params: { resource: unknown; s3Uri: S3Uri }): boolean {
    const { resource, s3Uri } = params;

    const targetArn = getObjectArn(s3Uri);

    return getValues(resource).some(resource =>
        getWildcardRegExp(resource).test(targetArn)
    );
}

function getDoesConditionMatch(params: {
    condition: unknown;
    effect: string | undefined;
}): boolean {
    const { condition, effect } = params;

    if (condition === undefined) {
        return true;
    }

    if (!isRecord(condition)) {
        return effect === "Deny";
    }

    const conditionEntries = Object.entries(condition);

    if (conditionEntries.length === 0) {
        return true;
    }

    let hasOnlySupportedConditions = true;

    const doesAllSupportedConditionsMatch = conditionEntries.every(
        ([operator, conditionValue]) => {
            const currentTimeComparison = getCurrentTimeComparison({
                operator,
                conditionValue
            });

            if (currentTimeComparison === undefined) {
                hasOnlySupportedConditions = false;
                return true;
            }

            return currentTimeComparison;
        }
    );

    if (!hasOnlySupportedConditions) {
        return effect === "Deny";
    }

    return doesAllSupportedConditionsMatch;
}

function getCurrentTimeComparison(params: {
    operator: string;
    conditionValue: unknown;
}): boolean | undefined {
    const { operator, conditionValue } = params;

    if (!isRecord(conditionValue)) {
        return undefined;
    }

    const currentTimeValues = getValues(conditionValue["aws:CurrentTime"]);

    if (currentTimeValues.length === 0) {
        return undefined;
    }

    const now = Date.now();

    const timestamps = currentTimeValues
        .map(value => Date.parse(value))
        .filter(timestamp => !Number.isNaN(timestamp));

    if (timestamps.length !== currentTimeValues.length) {
        return undefined;
    }

    switch (operator) {
        case "DateLessThan":
            return timestamps.some(timestamp => now < timestamp);
        case "DateLessThanEquals":
            return timestamps.some(timestamp => now <= timestamp);
        case "DateGreaterThan":
            return timestamps.some(timestamp => now > timestamp);
        case "DateGreaterThanEquals":
            return timestamps.some(timestamp => now >= timestamp);
        default:
            return undefined;
    }
}

function getObjectArn(s3Uri: S3Uri): string {
    return `arn:aws:s3:::${s3Uri.bucket}/${s3Uri.keySegments.join(s3Uri.delimiter)}${
        s3Uri.isDelimiterTerminated ? s3Uri.delimiter : ""
    }`;
}

function getValues(valueOrValues: unknown): string[] {
    if (typeof valueOrValues === "string") {
        return [valueOrValues];
    }

    if (!Array.isArray(valueOrValues)) {
        return [];
    }

    return valueOrValues.filter((value): value is string => typeof value === "string");
}

function getWildcardRegExp(pattern: string): RegExp {
    return new RegExp(`^${[...pattern].map(escapeWildcardChar).join("")}$`);
}

function escapeWildcardChar(char: string): string {
    switch (char) {
        case "*":
            return ".*";
        case "?":
            return ".";
        default:
            return char.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
    }
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
