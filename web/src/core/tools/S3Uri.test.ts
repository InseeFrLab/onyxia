import { describe, expect, it } from "vitest";
import { symToStr } from "tsafe/symToStr";
import { getIsInside, parseS3Uri } from "./S3Uri";

describe(symToStr({ getIsInside }), () => {
    it("returns false when prefix and uri are identical", () => {
        const s3UriPrefix = parseS3Uri({
            value: "s3://mybucket/aa/bb/",
            delimiter: "/"
        });

        const s3Uri = parseS3Uri({
            value: "s3://mybucket/aa/bb/",
            delimiter: "/"
        });

        const got = getIsInside({ s3UriPrefix, s3Uri });

        expect(got).toStrictEqual({ isInside: false });
    });

    it("detects a top-level child under a terminated prefix", () => {
        const s3UriPrefix = parseS3Uri({
            value: "s3://mybucket/aa/bb/",
            delimiter: "/"
        });

        const s3Uri = parseS3Uri({
            value: "s3://mybucket/aa/bb/cc",
            delimiter: "/"
        });

        const got = getIsInside({ s3UriPrefix, s3Uri });

        expect(got).toStrictEqual({ isInside: true, isTopLevel: true });
    });

    it("detects a top-level sibling when prefix targets a non-terminated object", () => {
        const s3UriPrefix = parseS3Uri({
            value: "s3://mybucket/aa/bb/cc",
            delimiter: "/"
        });

        const s3Uri = parseS3Uri({
            value: "s3://mybucket/aa/bb/ccc",
            delimiter: "/"
        });

        const got = getIsInside({ s3UriPrefix, s3Uri });

        expect(got).toStrictEqual({ isInside: true, isTopLevel: true });
    });

    it("returns false when uri is not inside the prefix", () => {
        const s3UriPrefix = parseS3Uri({
            value: "s3://mybucket/aa/bb/ccc",
            delimiter: "/"
        });

        const s3Uri = parseS3Uri({
            value: "s3://mybucket/aa/bb/cc",
            delimiter: "/"
        });

        const got = getIsInside({ s3UriPrefix, s3Uri });

        expect(got).toStrictEqual({ isInside: false });
    });
});
