import { assert, type Equals, id } from "tsafe";
import { same } from "evt/tools/inDepth/same";
import { z } from "zod";

export type S3Uri = S3Uri.Object | S3Uri.Prefix;

export namespace S3Uri {
    type Common = {
        bucket: string;
        delimiter: string;
        keySegments: string[];
    };

    export type Object = Common & {
        type: "object";
        keyBasename: string;
    };

    export type Prefix = Prefix.TerminatedByDelimiter | Prefix.NonTerminatedByDelimiter;

    export namespace Prefix {
        type Common_Prefix = Common & {
            type: "prefix";
        };

        export type TerminatedByDelimiter = Common_Prefix & {
            isDelimiterTerminated: true;
        };

        export type NonTerminatedByDelimiter = Common_Prefix & {
            isDelimiterTerminated: false;
            nextKeySegmentPrefix: string;
        };
    }
}

export function stringifyS3Uri(s3Uri: S3Uri): string {
    let s3UriStr = [
        "s3://",
        `${s3Uri.bucket}/`,
        s3Uri.keySegments.map(keySegment => `${keySegment}${s3Uri.delimiter}`).join("")
    ].join("");

    switch (s3Uri.type) {
        case "object":
            s3UriStr += s3Uri.keyBasename;
            break;
        case "prefix":
            if (!s3Uri.isDelimiterTerminated) {
                s3UriStr += s3Uri.nextKeySegmentPrefix;
            }
            break;
        default:
            assert<Equals<typeof s3Uri, never>>;
    }

    return s3UriStr;
}

export function getS3UriKeyOrKeyPrefix(s3Uri: S3Uri): string {
    return stringifyS3Uri(s3Uri).slice(`s3://${s3Uri.bucket}/`.length);
}

export function parseS3Uri(params: {
    value: string;
    delimiter: string;
    isPrefix: false;
}): S3Uri.Object;
export function parseS3Uri(params: {
    value: string;
    delimiter: string;
    isPrefix: true;
}): S3Uri.Prefix;
export function parseS3Uri(params: {
    value: string;
    delimiter: string;
    isPrefix: boolean;
}): S3Uri {
    const { value, delimiter, isPrefix } = params;

    const match = value.match(/^s3:\/\/([^/]+)(\/?.*)$/);

    if (match === null) {
        throw new Error(`Malformed S3 URI: ${value}`);
    }

    const bucket = match[1];

    const group2 = match[2];

    if (group2 === "" || group2 === "/") {
        return id<S3Uri.Prefix.TerminatedByDelimiter>({
            type: "prefix",
            bucket,
            delimiter,
            keySegments: [],
            isDelimiterTerminated: true
        });
    }

    const key = group2.slice(1);

    const [last, ...rest_reversed] = key.split(delimiter).reverse();

    const keySegments = rest_reversed.reverse();

    if (last === "") {
        assert(isPrefix);
        return id<S3Uri.Prefix.TerminatedByDelimiter>({
            type: "prefix",
            bucket,
            delimiter,
            keySegments,
            isDelimiterTerminated: true
        });
    }

    if (isPrefix) {
        return id<S3Uri.Prefix.NonTerminatedByDelimiter>({
            type: "prefix",
            bucket,
            delimiter,
            keySegments,
            isDelimiterTerminated: false,
            nextKeySegmentPrefix: last
        });
    }

    return id<S3Uri.Object>({
        type: "object",
        bucket,
        delimiter,
        keySegments,
        keyBasename: last
    });
}

export function getIsInside(params: {
    s3UriPrefix: S3Uri.Prefix;
    s3Uri: S3Uri;
}): { isInside: false; isTopLevel?: never } | { isInside: true; isTopLevel: boolean } {
    const { s3UriPrefix, s3Uri } = params;

    if (!stringifyS3Uri(s3Uri).startsWith(stringifyS3Uri(s3UriPrefix))) {
        return { isInside: false };
    }
    return {
        isInside: true,
        isTopLevel: same(s3UriPrefix.keySegments, s3Uri.keySegments)
    };
}

export const zS3UriObject = (() => {
    type TargetType = S3Uri.Object;

    const zTargetType = z.object({
        type: z.literal("object"),
        bucket: z.string(),
        delimiter: z.string(),
        keySegments: z.array(z.string()),
        keyBasename: z.string()
    });

    type InferredType = z.infer<typeof zTargetType>;

    assert<Equals<TargetType, InferredType>>;

    return id<z.ZodType<TargetType>>(zTargetType);
})();

export const zS3UriPrefixDelimiterTerminated = (() => {
    type TargetType = S3Uri.Prefix.TerminatedByDelimiter;

    const zTargetType = z.object({
        type: z.literal("prefix"),
        bucket: z.string(),
        delimiter: z.string(),
        keySegments: z.array(z.string()),
        isDelimiterTerminated: z.literal(true)
    });

    type InferredType = z.infer<typeof zTargetType>;

    assert<Equals<TargetType, InferredType>>;

    return id<z.ZodType<TargetType>>(zTargetType);
})();

export const zS3UriPrefixNonDelimiterTerminated = (() => {
    type TargetType = S3Uri.Prefix.NonTerminatedByDelimiter;

    const zTargetType = z.object({
        type: z.literal("prefix"),
        bucket: z.string(),
        delimiter: z.string(),
        keySegments: z.array(z.string()),
        isDelimiterTerminated: z.literal(false),
        nextKeySegmentPrefix: z.string()
    });

    type InferredType = z.infer<typeof zTargetType>;

    assert<Equals<TargetType, InferredType>>;

    return id<z.ZodType<TargetType>>(zTargetType);
})();

export const zS3UriPrefix = (() => {
    type TargetType = S3Uri.Prefix;

    const zTargetType = z.union([
        zS3UriPrefixDelimiterTerminated,
        zS3UriPrefixNonDelimiterTerminated
    ]);

    type InferredType = z.infer<typeof zTargetType>;

    assert<Equals<TargetType, InferredType>>;
    return id<z.ZodType<TargetType>>(zTargetType);
})();

export const zS3Uri = (() => {
    type TargetType = S3Uri;

    const zTargetType = z.union([zS3UriObject, zS3UriPrefix]);

    type InferredType = z.infer<typeof zTargetType>;

    assert<Equals<TargetType, InferredType>>;

    return id<z.ZodType<TargetType>>(zTargetType);
})();
