import type { S3BucketPolicy } from "core/ports/S3Client";
import { assert, Equals } from "tsafe";
import { z } from "zod";
import { id } from "tsafe/id";

const zS3Action = z.custom<`s3:${string}`>(
    val => typeof val === "string" && val.startsWith("s3:")
);

type S3PolicyStatement = S3BucketPolicy["Statement"][number];

const zS3PolicyStatement = (() => {
    type TargetType = S3PolicyStatement;

    const zTargetType = z.object({
        Effect: z.enum(["Allow", "Deny"]),
        Principal: z.union([z.string(), z.object({ AWS: z.string().array() })]),
        Action: z.union([zS3Action, zS3Action.array()]),
        Resource: z.string().array(),
        Condition: z.record(z.any()).optional()
    });

    type InferredType = z.infer<typeof zTargetType>;

    assert<Equals<TargetType, InferredType>>;

    return id<z.ZodType<TargetType>>(zTargetType);
})();

export const zS3BucketPolicy = (() => {
    type TargetType = S3BucketPolicy;

    const zTargetType = z.object({
        Version: z.literal("2012-10-17"),
        Statement: z.array(zS3PolicyStatement)
    });

    type InferredType = z.infer<typeof zTargetType>;

    assert<Equals<TargetType, InferredType>>;

    return id<z.ZodType<TargetType>>(zTargetType);
})();
