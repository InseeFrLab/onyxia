import { describe, it, expect } from "vitest";
import { assignValueAtPath } from "./assignValueAtPath";
import { symToStr } from "tsafe/symToStr";

describe(symToStr({ assignValueAtPath }), () => {
    it("works with base case", () => {
        const object = {
            a: [{ b: null }]
        };

        assignValueAtPath({
            stringifyableObjectOrArray: object,
            path: ["a", 0, "b"],
            value: [1, 2, 3]
        });

        expect(object).toStrictEqual({
            a: [
                {
                    b: [1, 2, 3]
                }
            ]
        });
    });

    it("create sub object/array", () => {
        const object = {};

        assignValueAtPath({
            stringifyableObjectOrArray: object,
            path: ["a", 0, "b"],
            value: [1, 2, 3]
        });

        expect(object).toStrictEqual({
            a: [
                {
                    b: [1, 2, 3]
                }
            ]
        });
    });
});
