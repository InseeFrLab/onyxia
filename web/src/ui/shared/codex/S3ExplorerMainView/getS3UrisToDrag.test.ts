import { describe, it, expect } from "vitest";
import { getS3UrisToDrag } from "./getS3UrisToDrag";
import { parseS3Uri, stringifyS3Uri, type S3Uri } from "core/tools/S3Uri";

type Item = { s3Uri: S3Uri; isDraggable: boolean };

const item = (value: string, isDraggable = true): Item => ({
    s3Uri: parseS3Uri({ value, delimiter: "/" }),
    isDraggable
});

const call = (draggedItem: Item, selectedItems: Item[]) =>
    getS3UrisToDrag({
        draggedItem,
        selectedItems,
        getIsDraggable: ({ isDraggable }) => isDraggable,
        getItemKey: ({ s3Uri }) => stringifyS3Uri(s3Uri)
    })?.map(stringifyS3Uri);

describe("getS3UrisToDrag", () => {
    it("drags the row alone when it is not part of the selection", () => {
        const dragged = item("s3://bucket/c.csv");

        expect(
            call(dragged, [item("s3://bucket/a.csv"), item("s3://bucket/b.csv")])
        ).toEqual(["s3://bucket/c.csv"]);
    });

    it("drags the whole selection when the row is part of it", () => {
        const dragged = item("s3://bucket/a.csv");

        expect(call(dragged, [dragged, item("s3://bucket/b.csv")])).toEqual([
            "s3://bucket/a.csv",
            "s3://bucket/b.csv"
        ]);
    });

    it("identifies the row by its URI, not by object identity", () => {
        // The list is virtualized and re-derived on every listing, so the item
        // object handed to the drag handler is routinely a different object than
        // the one in the selection array that represents the same key.
        expect(call(item("s3://bucket/a.csv"), [item("s3://bucket/a.csv")])).toEqual([
            "s3://bucket/a.csv"
        ]);
    });

    it("refuses to start a drag on a row that is busy", () => {
        expect(call(item("s3://bucket/a.csv", false), [])).toBeUndefined();
    });

    it("leaves busy rows out of a multi-row drag rather than refusing it", () => {
        const dragged = item("s3://bucket/a.csv");

        expect(call(dragged, [dragged, item("s3://bucket/busy.csv", false)])).toEqual([
            "s3://bucket/a.csv"
        ]);
    });

    it("refuses the drag when every selected row is busy", () => {
        const dragged = item("s3://bucket/a.csv");
        const selected = [
            { ...dragged, isDraggable: false },
            item("s3://bucket/b.csv", false)
        ];

        expect(
            getS3UrisToDrag({
                draggedItem: { ...dragged, isDraggable: false },
                selectedItems: selected,
                getIsDraggable: ({ isDraggable }) => isDraggable,
                getItemKey: ({ s3Uri }) => stringifyS3Uri(s3Uri)
            })
        ).toBeUndefined();
    });

    it("carries prefixes as well as objects", () => {
        const dragged = item("s3://bucket/reports/");

        expect(call(dragged, [dragged, item("s3://bucket/a.csv")])).toEqual([
            "s3://bucket/reports/",
            "s3://bucket/a.csv"
        ]);
    });
});
