import { S3BucketPolicy } from "core/ports/S3Client";
import { assert, Equals } from "tsafe";
import { z } from "zod";

const s3ActionSchema = z.custom<`s3:${string}`>(
    val => typeof val === "string" && val.startsWith("s3:")
);

const s3PolicyStatementSchema = z.object({
    Effect: z.enum(["Allow", "Deny"]),
    Principal: z.union([z.string(), z.object({ AWS: z.string().array() })]),
    Action: z.union([s3ActionSchema, s3ActionSchema.array()]),
    Resource: z.string().array(),
    Condition: z.record(z.any()).optional()
});

export const s3BucketPolicySchema = z.object({
    Version: z.literal("2012-10-17"),
    Statement: z.array(s3PolicyStatementSchema)
});

assert<Equals<z.infer<typeof s3BucketPolicySchema>, S3BucketPolicy>>(true);
