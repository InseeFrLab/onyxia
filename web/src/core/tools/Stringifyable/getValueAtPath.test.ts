import { describe, it, expect } from "vitest";
import { getValueAtPath } from "./getValueAtPath";
import { symToStr } from "tsafe/symToStr";

describe(symToStr({ getValueAtPath }), () => {
    it("works with base case", () => {
        const got = getValueAtPath({
            stringifyableObjectOrArray: { a: [{ b: 42 }] },
            path: ["a", 0, "b"],
            doDeleteFromSource: false,
            doFailOnUnresolved: false
        });

        expect(got).toBe(42);
    });

    it("returns undefined if path does not exist", () => {
        const got = getValueAtPath({
            stringifyableObjectOrArray: {},
            path: ["a", 0, "b"],
            doDeleteFromSource: false,
            doFailOnUnresolved: false
        });

        expect(got).toBe(undefined);
    });

    it("works with deleteFromSource set to true", () => {
        const stringifyableObjectOrArray = { a: [{ b: 42 }] };

        const got = getValueAtPath({
            stringifyableObjectOrArray,
            path: ["a", 0, "b"],
            doDeleteFromSource: true,
            doFailOnUnresolved: false
        });

        expect(got).toBe(42);
        expect(stringifyableObjectOrArray).toStrictEqual({ a: [{}] });
    });

    it("to throw when doFailOnUnresolved is set to true", () => {
        expect(() => {
            getValueAtPath({
                stringifyableObjectOrArray: {},
                path: ["a", 0, "b"],
                doDeleteFromSource: false,
                doFailOnUnresolved: true
            });
        }).toThrow();
    });
});
