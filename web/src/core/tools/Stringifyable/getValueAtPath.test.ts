import { describe, it, expect } from "vitest";
import { getValueAtPath } from "./getValueAtPath";
import { symToStr } from "tsafe/symToStr";

describe(symToStr({ getValueAtPath }), () => {
    it("works with base case", () => {
        const got = getValueAtPath({ a: [{ b: 42 }] }, ["a", 0, "b"]);

        expect(got).toBe(42);
    });

    it("returns undefined if path does not exist", () => {
        const got = getValueAtPath({}, ["a", 0, "b"]);

        expect(got).toBe(undefined);
    });
});
