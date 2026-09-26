import type { S3Uri } from "core/tools/S3Uri";

/**
 * The value CopyObject's `CopySource` parameter takes: `bucket/key`,
 * percent-encoded.
 *
 * The AWS SDK does not encode this one — it is a header value, not a path
 * parameter — and an unencoded key containing a space, a `+` or a `#` either
 * fails the request or, worse, copies a DIFFERENT object than the one asked
 * for. Each segment is encoded on its own so the delimiters between them
 * survive.
 */
export function getCopySource(s3Uri: S3Uri.NonTerminatedByDelimiter): string {
    return [
        encodeURIComponent(s3Uri.bucket),
        s3Uri.keySegments.map(encodeURIComponent).join(s3Uri.delimiter)
    ].join("/");
}
