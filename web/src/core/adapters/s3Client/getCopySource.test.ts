import { describe, it, expect } from "vitest";
import { getCopySource } from "./getCopySource";
import { parseS3Uri, type S3Uri } from "core/tools/S3Uri";

const object = (value: string) =>
    parseS3Uri({ value, delimiter: "/" }) as S3Uri.NonTerminatedByDelimiter;

describe("getCopySource", () => {
    it("joins bucket and key", () => {
        expect(getCopySource(object("s3://bucket/in/a.csv"))).toBe("bucket/in/a.csv");
    });

    it("encodes a space, which is otherwise a malformed request", () => {
        expect(getCopySource(object("s3://bucket/my report.csv"))).toBe(
            "bucket/my%20report.csv"
        );
    });

    it("encodes a plus, which would otherwise be read back as a space", () => {
        expect(getCopySource(object("s3://bucket/a+b.csv"))).toBe("bucket/a%2Bb.csv");
    });

    it("encodes a hash, which would otherwise truncate the key", () => {
        expect(getCopySource(object("s3://bucket/a#b.csv"))).toBe("bucket/a%23b.csv");
    });

    it("keeps the delimiters between segments unencoded", () => {
        expect(getCopySource(object("s3://bucket/a/b/c.csv"))).toBe("bucket/a/b/c.csv");
    });

    it("encodes non-ascii", () => {
        expect(getCopySource(object("s3://bucket/rapport-été.csv"))).toBe(
            "bucket/rapport-%C3%A9t%C3%A9.csv"
        );
    });
});
