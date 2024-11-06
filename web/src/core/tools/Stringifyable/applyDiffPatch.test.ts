import { describe, it, expect } from "vitest";
import { computeDiff } from "./computeDiff";
import { applyDiffPatch } from "./applyDiffPatch";
import { symToStr } from "tsafe/symToStr";

describe(symToStr({ applyDiffPatch }), () => {
    it("works with base case", () => {
        const before = { a: 41 };
        const current = { a: 42 };

        const { diffPatch } = computeDiff({
            before,
            current
        });

        applyDiffPatch({
            objectOrArray: before,
            diffPatch
        });

        expect(before).toStrictEqual(current);
    });

    it("works when the value wasn't previously set", () => {
        const before = {};
        const current = { a: 42 };

        const { diffPatch } = computeDiff({
            before,
            current
        });

        applyDiffPatch({
            objectOrArray: before,
            diffPatch
        });

        expect(before).toStrictEqual(current);
    });

    it("works when a value is added to an array", () => {
        const before = { arr: ["a", "b"] };
        const current = { arr: ["a", "b", "c"] };

        const { diffPatch } = computeDiff({
            before,
            current
        });

        applyDiffPatch({
            objectOrArray: before,
            diffPatch
        });

        expect(before).toStrictEqual(current);
    });

    it("works when a value removed from an array", () => {
        const before = { arr: ["a", "b"] };
        const current = { arr: ["a"] };

        const { diffPatch } = computeDiff({
            before,
            current
        });

        applyDiffPatch({
            objectOrArray: before,
            diffPatch
        });

        expect(before).toStrictEqual(current);
    });

    it("works when an array is changed", () => {
        const before = { arr: ["a", "b", "c"] };
        const current = { arr: ["a", "d"] };

        const { diffPatch } = computeDiff({
            before,
            current
        });

        applyDiffPatch({
            objectOrArray: before,
            diffPatch
        });

        expect(before).toStrictEqual(current);
    });

    it("works when an element has been removed", () => {
        const before = { x: "foo" };
        const current = {};

        const { diffPatch } = computeDiff({
            before,
            current
        });

        applyDiffPatch({
            objectOrArray: before,
            diffPatch
        });

        expect(before).toStrictEqual(current);
    });
});
