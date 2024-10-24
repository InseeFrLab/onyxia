import { S3BucketPolicy } from "core/ports/S3Client";
import { assert, Equals } from "tsafe";
import { z } from "zod";

const s3ActionSchema = z.enum([
    "s3:AbortMultipartUpload",
    "s3:BypassGovernanceRetention",
    "s3:CreateBucket",
    "s3:DeleteBucket",
    "s3:DeleteBucketPolicy",
    "s3:DeleteObject",
    "s3:DeleteObjectTagging",
    "s3:GetBucketAcl",
    "s3:GetBucketPolicy",
    "s3:GetObject",
    "s3:GetObjectTagging",
    "s3:ListBucket",
    "s3:PutObject",
    "s3:PutObjectAcl",
    "s3:PutBucketPolicy",
    "s3:ReplicateObject",
    "s3:RestoreObject",
    "s3:ListMultipartUploadParts",
    "s3:ListBucketVersions",
    "s3:ListBucketMultipartUploads",
    "s3:PutBucketVersioning",
    "s3:PutBucketTagging",
    "s3:GetBucketTagging",
    "s3:*"
]);

const s3PolicyStatementSchema = z.object({
    Effect: z.enum(["Allow", "Deny"]),
    Principal: z.union([z.string(), z.object({ AWS: z.string().array() })]),
    Action: z.union([s3ActionSchema, s3ActionSchema.array()]),
    Resource: z.union([z.string(), z.string().array()]),
    Condition: z.record(z.any()).optional()
});

const s3BucketPolicySchema = z.object({
    Version: z.literal("2012-10-17"),
    Statement: z.array(s3PolicyStatementSchema)
});

assert<Equals<z.infer<typeof s3BucketPolicySchema>, S3BucketPolicy>>(true);
