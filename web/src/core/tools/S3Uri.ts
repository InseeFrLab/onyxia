import { assert, type Equals, id } from "tsafe";
import { same } from "evt/tools/inDepth/same";
import { z } from "zod";

export type S3Uri = S3Uri.TerminatedByDelimiter | S3Uri.NonTerminatedByDelimiter;

export namespace S3Uri {
    type Common = {
        bucket: string;
        delimiter: string;
        keySegments: string[];
    };

    export type TerminatedByDelimiter = Common & {
        isDelimiterTerminated: true;
    };

    export type NonTerminatedByDelimiter = Common & {
        isDelimiterTerminated: false;
    };
}

export function stringifyS3Uri(s3Uri: S3Uri): string {
    return [
        "s3://",
        `${s3Uri.bucket}/`,
        s3Uri.keySegments
            .map(
                (keySegment, i) =>
                    `${keySegment}${s3Uri.isDelimiterTerminated ? s3Uri.delimiter : i === s3Uri.keySegments.length - 1 ? "" : s3Uri.delimiter}`
            )
            .join("")
    ].join("");
}

export function getS3UriKey(s3Uri: S3Uri): string {
    return stringifyS3Uri(s3Uri).slice(`s3://${s3Uri.bucket}/`.length);
}

export function parseS3Uri(params: { value: string; delimiter: string }): S3Uri {
    const { value, delimiter } = params;

    const match = value.match(/^s3:\/\/([^/]+)(\/?.*)$/);

    if (match === null) {
        throw new Error(`Malformed S3 URI: ${value}`);
    }

    const bucket = match[1];

    const group2 = match[2];

    if (group2 === "" || group2 === "/") {
        return id<S3Uri.TerminatedByDelimiter>({
            bucket,
            delimiter,
            keySegments: [],
            isDelimiterTerminated: true
        });
    }

    const key = group2.slice(1);

    const split = key.split(delimiter);

    const isDelimiterTerminated = split.at(-1) === "";

    if (isDelimiterTerminated) {
        split.pop();
    }

    return {
        bucket,
        delimiter,
        keySegments: split,
        isDelimiterTerminated
    };
}

export function getIsInside(params: {
    s3UriPrefix: S3Uri;
    s3Uri: S3Uri;
}): { isInside: false; isTopLevel?: never } | { isInside: true; isTopLevel: boolean } {
    const { s3UriPrefix, s3Uri } = params;

    if (
        !stringifyS3Uri(s3Uri).startsWith(stringifyS3Uri(s3UriPrefix)) ||
        same(s3Uri, s3UriPrefix)
    ) {
        return { isInside: false };
    }

    return {
        isInside: true,
        isTopLevel: same(
            s3UriPrefix.isDelimiterTerminated
                ? s3UriPrefix.keySegments
                : s3UriPrefix.keySegments.slice(0, -1),
            s3Uri.keySegments.slice(0, -1)
        )
    };
}

export const zS3Uri_NonTerminatedByDelimiter = (() => {
    type TargetType = S3Uri.NonTerminatedByDelimiter;

    const zTargetType = z.object({
        bucket: z.string(),
        delimiter: z.string(),
        keySegments: z.array(z.string()),
        isDelimiterTerminated: z.literal(false)
    });

    type InferredType = z.infer<typeof zTargetType>;

    assert<Equals<TargetType, InferredType>>;

    return id<z.ZodType<TargetType>>(zTargetType);
})();

export const zS3Uri_TerminatedByDelimiter = (() => {
    type TargetType = S3Uri.TerminatedByDelimiter;

    const zTargetType = z.object({
        bucket: z.string(),
        delimiter: z.string(),
        keySegments: z.array(z.string()),
        isDelimiterTerminated: z.literal(true)
    });

    type InferredType = z.infer<typeof zTargetType>;

    assert<Equals<TargetType, InferredType>>;

    return id<z.ZodType<TargetType>>(zTargetType);
})();

export const zS3Uri = (() => {
    type TargetType = S3Uri;

    const zTargetType = z.union([
        zS3Uri_NonTerminatedByDelimiter,
        zS3Uri_TerminatedByDelimiter
    ]);

    type InferredType = z.infer<typeof zTargetType>;

    assert<Equals<TargetType, InferredType>>;

    return id<z.ZodType<TargetType>>(zTargetType);
})();
