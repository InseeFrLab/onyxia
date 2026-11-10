import { describe, it, expect } from "vitest";
import {
    S3_OBJECTS_DRAG_MIME,
    getHasS3ObjectsDragData,
    getS3ObjectsDragData,
    setS3ObjectsDragData
} from "./s3ObjectsDragData";
import { parseS3Uri, stringifyS3Uri } from "core/tools/S3Uri";

/** Enough of DataTransfer to exercise the contract; jsdom is not in play here. */
function createDataTransfer(entries: Record<string, string> = {}): DataTransfer {
    const store = new Map(Object.entries(entries));

    return {
        get types() {
            return Array.from(store.keys());
        },
        setData: (format: string, data: string) => void store.set(format, data),
        getData: (format: string) => store.get(format) ?? ""
    } as unknown as DataTransfer;
}

const uri = (value: string) => parseS3Uri({ value, delimiter: "/" });

describe("s3ObjectsDragData", () => {
    it("round-trips the URIs it was given", () => {
        const dataTransfer = createDataTransfer();

        setS3ObjectsDragData({
            dataTransfer,
            s3Uris: [uri("s3://bucket/a.csv"), uri("s3://bucket/reports/")]
        });

        expect(
            getS3ObjectsDragData({ dataTransfer, delimiter: "/" })?.s3Uris.map(
                stringifyS3Uri
            )
        ).toEqual(["s3://bucket/a.csv", "s3://bucket/reports/"]);
    });

    it("also publishes text/plain, so a plain text field receives the URIs", () => {
        const dataTransfer = createDataTransfer();

        setS3ObjectsDragData({
            dataTransfer,
            s3Uris: [uri("s3://bucket/a.csv"), uri("s3://bucket/b.csv")]
        });

        expect(dataTransfer.getData("text/plain")).toBe(
            "s3://bucket/a.csv\ns3://bucket/b.csv"
        );
    });

    it("detects the drag from types alone", () => {
        // The values are deliberately empty: during dragover every browser puts
        // the DataTransfer in protected mode and getData() returns "". A check
        // written against getData() therefore works in a unit test and refuses
        // every real drag.
        expect(
            getHasS3ObjectsDragData(createDataTransfer({ [S3_OBJECTS_DRAG_MIME]: "" }))
        ).toBe(true);

        expect(getHasS3ObjectsDragData(createDataTransfer({ "text/plain": "hi" }))).toBe(
            false
        );
    });

    it("returns undefined for a drag that carries no S3 objects", () => {
        expect(
            getS3ObjectsDragData({
                dataTransfer: createDataTransfer({ "text/plain": "s3://bucket/a.csv" }),
                delimiter: "/"
            })
        ).toBeUndefined();
    });

    it.each([
        ["not JSON", "}{"],
        ["JSON that is not an object", '"s3://bucket/a.csv"'],
        ["an object without s3Uris", "{}"],
        ["s3Uris that is not an array", '{"s3Uris":"s3://bucket/a.csv"}'],
        ["an empty list", '{"s3Uris":[]}'],
        ["a non-string entry", '{"s3Uris":[42]}'],
        ["a malformed URI", '{"s3Uris":["not-an-s3-uri"]}']
    ])("returns undefined rather than throwing on %s", (_label, raw) => {
        expect(
            getS3ObjectsDragData({
                dataTransfer: createDataTransfer({ [S3_OBJECTS_DRAG_MIME]: raw }),
                delimiter: "/"
            })
        ).toBeUndefined();
    });

    it("parses against the delimiter of the destination, not the source", () => {
        const dataTransfer = createDataTransfer({
            [S3_OBJECTS_DRAG_MIME]: '{"s3Uris":["s3://bucket/a/b/c.csv"]}'
        });

        const s3Uris = getS3ObjectsDragData({ dataTransfer, delimiter: "/" })?.s3Uris;

        expect(s3Uris?.[0].keySegments).toEqual(["a", "b", "c.csv"]);
    });
});
