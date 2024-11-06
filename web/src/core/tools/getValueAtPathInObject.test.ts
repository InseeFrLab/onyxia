import { it, expect } from "vitest";
import { getValueAtPathInObject } from "./getValueAtPathInObject";

it("should return the correct value for a base case", () => {
    const got = getValueAtPathInObject({
        obj: {
            a: {
                b: 42
            }
        },
        path: ["a", "b"]
    });

    const expected = 42;

    expect(got).toBe(expected);
});

it("should resolve to object when the path points to an object", () => {
    const got = getValueAtPathInObject({
        obj: {
            a: {
                b: { c: 42 }
            }
        },
        path: ["a", "b"]
    });

    const expected = { c: 42 };

    expect(got).toStrictEqual(expected); // Use toStrictEqual for deep equality check
});

it("should resolve to undefined when the path does not exist", () => {
    const got = getValueAtPathInObject({
        obj: {
            a: {
                b: {}
            }
        },
        path: ["a", "b", "doesNotExist"]
    });

    const expected = undefined;

    expect(got).toBe(expected);
});

it("should work with arrays", () => {
    const got = getValueAtPathInObject({
        obj: {
            a: [{ b: 41 }, { b: 42 }]
        },
        path: ["a", 1, "b"]
    });

    const expected = 42;

    expect(got).toBe(expected);
});
