import { describe, it, expect } from "vitest";
import { getCopyRefusalReason, getCopyDestinationS3Uri } from "./copyPlan";
import { parseS3Uri, stringifyS3Uri, type S3Uri } from "core/tools/S3Uri";

const uri = (value: string) => parseS3Uri({ value, delimiter: "/" });
const prefix = (value: string) => uri(value) as S3Uri.TerminatedByDelimiter;
const object = (value: string) => uri(value) as S3Uri.NonTerminatedByDelimiter;

describe("getCopyRefusalReason", () => {
    it("allows an ordinary copy into another prefix", () => {
        expect(
            getCopyRefusalReason({
                sourceS3Uris: [uri("s3://bucket/in/a.csv")],
                destinationS3Uri: uri("s3://bucket/out/")
            })
        ).toBeUndefined();
    });

    it("allows a copy into another bucket", () => {
        expect(
            getCopyRefusalReason({
                sourceS3Uris: [uri("s3://one/a.csv")],
                destinationS3Uri: uri("s3://two/")
            })
        ).toBeUndefined();
    });

    it("refuses a destination that is an object, not a prefix", () => {
        expect(
            getCopyRefusalReason({
                sourceS3Uris: [uri("s3://bucket/in/a.csv")],
                destinationS3Uri: uri("s3://bucket/out/b.csv")
            })
        ).toBe("destination is not a prefix");
    });

    it("refuses dropping something back into the prefix it already lives in", () => {
        expect(
            getCopyRefusalReason({
                sourceS3Uris: [uri("s3://bucket/in/a.csv")],
                destinationS3Uri: uri("s3://bucket/in/")
            })
        ).toBe("already there");
    });

    it("refuses a bucket-root object dropped on the bucket root", () => {
        expect(
            getCopyRefusalReason({
                sourceS3Uris: [uri("s3://bucket/a.csv")],
                destinationS3Uri: uri("s3://bucket/")
            })
        ).toBe("already there");
    });

    it("allows the same key path in a DIFFERENT bucket", () => {
        expect(
            getCopyRefusalReason({
                sourceS3Uris: [uri("s3://one/in/a.csv")],
                destinationS3Uri: uri("s3://two/in/")
            })
        ).toBeUndefined();
    });

    it("refuses a prefix dropped onto itself", () => {
        expect(
            getCopyRefusalReason({
                sourceS3Uris: [uri("s3://bucket/in/reports/")],
                destinationS3Uri: uri("s3://bucket/in/reports/")
            })
        ).toBe("into itself");
    });

    it("refuses a prefix dropped back into the prefix that contains it", () => {
        expect(
            getCopyRefusalReason({
                sourceS3Uris: [uri("s3://bucket/in/reports/")],
                destinationS3Uri: uri("s3://bucket/in/")
            })
        ).toBe("already there");
    });

    it("refuses a prefix dropped into one of its own descendants", () => {
        // The crawl would keep finding the objects it has just written.
        expect(
            getCopyRefusalReason({
                sourceS3Uris: [uri("s3://bucket/reports/")],
                destinationS3Uri: uri("s3://bucket/reports/2025/q1/")
            })
        ).toBe("into itself");
    });

    it("allows a prefix dropped into a sibling whose name merely starts the same", () => {
        // `reports-archive` is not under `reports`, and a string-prefix check
        // rather than a segment check would say it was.
        expect(
            getCopyRefusalReason({
                sourceS3Uris: [uri("s3://bucket/reports/")],
                destinationS3Uri: uri("s3://bucket/reports-archive/")
            })
        ).toBeUndefined();
    });

    it("refuses a batch whose members would land on the same name", () => {
        expect(
            getCopyRefusalReason({
                sourceS3Uris: [uri("s3://bucket/a/x.csv"), uri("s3://bucket/b/x.csv")],
                destinationS3Uri: uri("s3://bucket/out/")
            })
        ).toBe("colliding names");
    });

    it("reports the reason for whichever member is impossible", () => {
        expect(
            getCopyRefusalReason({
                sourceS3Uris: [uri("s3://bucket/out/fine.csv"), uri("s3://bucket/out/")],
                destinationS3Uri: uri("s3://bucket/out/")
            })
        ).toBe("already there");
    });
});

describe("getCopyDestinationS3Uri", () => {
    const call = (source: string, dragged: string, destination: string) =>
        stringifyS3Uri(
            getCopyDestinationS3Uri({
                sourceS3Uri: object(source),
                draggedS3Uri: uri(dragged),
                destinationS3Uri: prefix(destination)
            })
        );

    it("keeps the basename when an object was dragged", () => {
        expect(
            call("s3://bucket/in/a.csv", "s3://bucket/in/a.csv", "s3://bucket/out/")
        ).toBe("s3://bucket/out/a.csv");
    });

    it("keeps the folder name and internal shape when a prefix was dragged", () => {
        expect(
            call(
                "s3://bucket/in/reports/2025/q1.csv",
                "s3://bucket/in/reports/",
                "s3://bucket/out/"
            )
        ).toBe("s3://bucket/out/reports/2025/q1.csv");
    });

    it("does not flatten a deep prefix into the destination", () => {
        // The bug this guards is taking the object's basename instead of its
        // path below the dragged item: every file would land side by side and
        // same-named files in different folders would overwrite each other.
        expect(
            call(
                "s3://bucket/in/reports/2024/q1.csv",
                "s3://bucket/in/reports/",
                "s3://bucket/out/"
            )
        ).not.toBe("s3://bucket/out/q1.csv");
    });

    it("copies into the bucket root", () => {
        expect(call("s3://bucket/in/a.csv", "s3://bucket/in/a.csv", "s3://bucket/")).toBe(
            "s3://bucket/a.csv"
        );
    });

    it("copies from the bucket root into a prefix", () => {
        expect(call("s3://bucket/a.csv", "s3://bucket/a.csv", "s3://bucket/out/")).toBe(
            "s3://bucket/out/a.csv"
        );
    });

    it("crosses buckets", () => {
        expect(call("s3://one/in/a.csv", "s3://one/in/a.csv", "s3://two/landing/")).toBe(
            "s3://two/landing/a.csv"
        );
    });

    it("throws when the object is not under what was dragged", () => {
        expect(() =>
            call(
                "s3://bucket/elsewhere/a.csv",
                "s3://bucket/in/reports/",
                "s3://bucket/out/"
            )
        ).toThrow();
    });
});
