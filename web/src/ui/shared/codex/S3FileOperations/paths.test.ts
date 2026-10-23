import { describe, expect, it } from "vitest";
import {
    directoryBreadcrumbs,
    isForbiddenDestination,
    normalizeDirectory
} from "./paths";
describe("S3 destination paths", () => {
    it.each([
        ["s3://bucket", "s3://bucket/"],
        ["s3://bucket/key", "s3://bucket/key/"],
        ["s3://bucket/a//b/", "s3://bucket/a//b/"],
        ["s3://bucket/a%2Fb/", "s3://bucket/a%2Fb/"],
        ["s3://bucket/a #? /", "s3://bucket/a #? /"],
        ["https://bucket/key", undefined],
        ["s3:///key", undefined],
        ["s3://bad bucket/key", undefined]
    ])("normalizes %s without rewriting literal object keys", (input, expected) =>
        expect(normalizeDirectory(input!, "/")).toBe(expected)
    );
    it("builds navigable breadcrumbs including the bucket root and empty segments", () => {
        expect(directoryBreadcrumbs("s3://bucket/a//b/", "/")).toEqual([
            { label: "bucket", uri: "s3://bucket/" },
            { label: "a", uri: "s3://bucket/a/" },
            { label: "", uri: "s3://bucket/a//" },
            { label: "b", uri: "s3://bucket/a//b/" }
        ]);
    });
    it.each([
        ["s3://bucket/foo/", true],
        ["s3://bucket/foo/nested/", true],
        ["s3://bucket/", true],
        ["s3://bucket/foobar/", false],
        ["s3://other/foo/", false],
        ["s3://bucket/target/", false]
    ])("checks recursive and self destinations %s", (directory, expected) => {
        expect(
            isForbiddenDestination({
                directory,
                delimiter: "/",
                sources: [{ uri: "s3://bucket/foo/", isDirectory: true }]
            })
        ).toBe(expected);
    });
    it("checks object self-copies and supports custom delimiters", () => {
        expect(
            isForbiddenDestination({
                directory: "s3://bucket/foo/",
                delimiter: "/",
                sources: [{ uri: "s3://bucket/foo/file", isDirectory: false }]
            })
        ).toBe(true);
        expect(normalizeDirectory("s3://bucket/a:b", ":")).toBe("s3://bucket/a:b:");
        expect(directoryBreadcrumbs("s3://bucket/a:b:", ":")).toEqual([
            { label: "bucket", uri: "s3://bucket/" },
            { label: "a", uri: "s3://bucket/a:" },
            { label: "b", uri: "s3://bucket/a:b:" }
        ]);
    });
});
