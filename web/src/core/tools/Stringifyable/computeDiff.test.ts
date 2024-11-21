import { describe, it, expect } from "vitest";
import { computeDiff } from "./computeDiff";
import { symToStr } from "tsafe/symToStr";

describe(symToStr({ computeDiff }), () => {
    it("works with base case", () => {
        const { diffPatch } = computeDiff({
            before: { a: 41 },
            current: { a: 42 }
        });

        expect(diffPatch).toStrictEqual([
            {
                path: ["a"],
                value: 42
            }
        ]);
    });

    it("works when the value wasn't previously set", () => {
        const { diffPatch } = computeDiff({
            before: {},
            current: { a: 42 }
        });

        expect(diffPatch).toStrictEqual([
            {
                path: ["a"],
                value: 42
            }
        ]);
    });

    it("works when a value is added to an array", () => {
        const { diffPatch } = computeDiff({
            before: { arr: ["a", "b"] },
            current: { arr: ["a", "b", "c"] }
        });

        expect(diffPatch).toStrictEqual([
            {
                path: ["arr", 2],
                value: "c"
            }
        ]);
    });

    it("works when a value removed from an array", () => {
        const { diffPatch } = computeDiff({
            before: { arr: ["a", "b"] },
            current: { arr: ["a"] }
        });

        expect(diffPatch).toStrictEqual([
            {
                path: ["arr", 1],
                value: undefined
            }
        ]);
    });

    it("works when an array is changed", () => {
        const { diffPatch } = computeDiff({
            before: { arr: ["a", "b", "c"] },
            current: { arr: ["a", "d"] }
        });

        expect(diffPatch).toStrictEqual([
            {
                path: ["arr", 1],
                value: "d"
            },
            {
                path: ["arr", 2],
                value: undefined
            }
        ]);
    });

    it("works when an element has been removed", () => {
        const { diffPatch } = computeDiff({
            before: { x: "foo" },
            current: {}
        });

        expect(diffPatch).toStrictEqual([
            {
                path: ["x"],
                value: undefined
            }
        ]);
    });
});
