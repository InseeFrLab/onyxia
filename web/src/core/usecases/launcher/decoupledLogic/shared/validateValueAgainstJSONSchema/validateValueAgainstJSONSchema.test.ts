import { it, expect, describe } from "vitest";
import {
    validateValueAgainstJSONSchema,
    type XOnyxiaContextLike
} from "./validateValueAgainstJSONSchema";
import { symToStr } from "tsafe/symToStr";

describe(symToStr({ validateValueAgainstJSONSchema }), () => {
    it("base case", () => {
        const xOnyxiaContext: XOnyxiaContextLike = {};

        const got = validateValueAgainstJSONSchema({
            helmValuesSchema: {
                type: "string"
            },
            xOnyxiaContext,
            value: "a"
        });

        const expected = { isValid: true };

        expect(got).toStrictEqual(expected);
    });

    it("fail case, with approx", () => {
        const xOnyxiaContext: XOnyxiaContextLike = {};

        const got = validateValueAgainstJSONSchema({
            helmValuesSchema: {
                type: "string"
            },
            xOnyxiaContext,
            value: 3
        });

        const expected = { isValid: false, reasonableApproximation: "3" };

        expect(got).toStrictEqual(expected);
    });

    it("fail case, no approx", () => {
        const xOnyxiaContext: XOnyxiaContextLike = {};

        const got = validateValueAgainstJSONSchema({
            helmValuesSchema: {
                type: "number"
            },
            xOnyxiaContext,
            value: "not something that can be converted to a number"
        });

        const expected = { isValid: false, reasonableApproximation: undefined };

        expect(got).toStrictEqual(expected);
    });

    it("approx boolean", () => {
        const xOnyxiaContext: XOnyxiaContextLike = {};

        const got = validateValueAgainstJSONSchema({
            helmValuesSchema: {
                type: "boolean"
            },
            xOnyxiaContext,
            value: "true"
        });

        const expected = { isValid: false, reasonableApproximation: true };

        expect(got).toStrictEqual(expected);
    });

    it("array base case", () => {
        const xOnyxiaContext: XOnyxiaContextLike = {};

        const got = validateValueAgainstJSONSchema({
            helmValuesSchema: {
                type: "array",
                items: {
                    type: "string"
                }
            },
            xOnyxiaContext,
            value: ["a", "b", "c"]
        });

        const expected = { isValid: true };

        expect(got).toStrictEqual(expected);
    });

    it("array base case - with approx", () => {
        const xOnyxiaContext: XOnyxiaContextLike = {};

        const got = validateValueAgainstJSONSchema({
            helmValuesSchema: {
                type: "array",
                items: {
                    type: "string"
                }
            },
            xOnyxiaContext,
            value: ["a", "b", 3]
        });

        const expected = { isValid: false, reasonableApproximation: ["a", "b", "3"] };

        expect(got).toStrictEqual(expected);
    });

    it("array enum", () => {
        const xOnyxiaContext: XOnyxiaContextLike = {
            r: ["a", "b", "c", "d"]
        };

        const got = validateValueAgainstJSONSchema({
            helmValuesSchema: {
                type: "array",
                items: {
                    type: "string",
                    "x-onyxia": {
                        overwriteListEnumWith: "r"
                    }
                }
            },
            xOnyxiaContext,
            value: ["a", "b", "c"]
        });

        const expected = { isValid: true };

        expect(got).toStrictEqual(expected);
    });

    it("array enum - not valid", () => {
        const xOnyxiaContext: XOnyxiaContextLike = {
            r: ["a", "b"]
        };

        const got = validateValueAgainstJSONSchema({
            helmValuesSchema: {
                type: "array",
                items: {
                    type: "string",
                    "x-onyxia": {
                        overwriteListEnumWith: "r"
                    }
                }
            },
            xOnyxiaContext,
            value: ["a", "b", "c"]
        });

        const expected = { isValid: false, reasonableApproximation: undefined };

        expect(got).toStrictEqual(expected);
    });

    it("invalid is not matching pattern", () => {
        const xOnyxiaContext: XOnyxiaContextLike = {};

        const got = validateValueAgainstJSONSchema({
            helmValuesSchema: {
                type: "string",
                pattern: "^[0-9]+$"
            },
            xOnyxiaContext,
            value: "a"
        });

        const expected = { isValid: false, reasonableApproximation: undefined };

        expect(got).toStrictEqual(expected);
    });

    it("valid on matching pattern", () => {
        const xOnyxiaContext: XOnyxiaContextLike = {};

        const got = validateValueAgainstJSONSchema({
            helmValuesSchema: {
                type: "string",
                pattern: "^[0-9]+$"
            },
            xOnyxiaContext,
            value: "42"
        });

        const expected = { isValid: true };

        expect(got).toStrictEqual(expected);
    });

    it("invalid if exceed max items", () => {
        const xOnyxiaContext: XOnyxiaContextLike = {};

        const got = validateValueAgainstJSONSchema({
            helmValuesSchema: {
                type: "array",
                maxItems: 2,
                items: {
                    type: "string"
                }
            },
            xOnyxiaContext,
            value: ["a", "b", "c"]
        });

        const expected = { isValid: false, reasonableApproximation: undefined };

        expect(got).toStrictEqual(expected);
    });

    it("invalid if below min items", () => {
        const xOnyxiaContext: XOnyxiaContextLike = {};

        const got = validateValueAgainstJSONSchema({
            helmValuesSchema: {
                type: "array",
                minItems: 2,
                items: {
                    type: "string"
                }
            },
            xOnyxiaContext,
            value: ["a"]
        });

        const expected = { isValid: false, reasonableApproximation: undefined };

        expect(got).toStrictEqual(expected);
    });

    it("valid if correct range of items", () => {
        const xOnyxiaContext: XOnyxiaContextLike = {};

        const got = validateValueAgainstJSONSchema({
            helmValuesSchema: {
                type: "array",
                minItems: 2,
                maxItems: 4
            },
            xOnyxiaContext,
            value: ["a", "b", "c"]
        });

        const expected = { isValid: true };

        expect(got).toStrictEqual(expected);
    });

    it("invalid if below minimum", () => {
        const xOnyxiaContext: XOnyxiaContextLike = {};

        const got = validateValueAgainstJSONSchema({
            helmValuesSchema: {
                type: "number",
                minimum: 2
            },
            xOnyxiaContext,
            value: 1
        });

        const expected = { isValid: false, reasonableApproximation: undefined };

        expect(got).toStrictEqual(expected);
    });

    it("valid if above minimum", () => {
        const xOnyxiaContext: XOnyxiaContextLike = {};

        const got = validateValueAgainstJSONSchema({
            helmValuesSchema: {
                type: "number",
                minimum: 2
            },
            xOnyxiaContext,
            value: 3
        });

        const expected = { isValid: true };

        expect(got).toStrictEqual(expected);
    });

    it("valid if slider in range", () => {
        const xOnyxiaContext: XOnyxiaContextLike = {};

        const got = validateValueAgainstJSONSchema({
            helmValuesSchema: {
                type: "string",
                sliderMin: 2,
                sliderMax: 4,
                sliderUnit: "Gi"
            },
            xOnyxiaContext,
            value: "4Gi"
        });

        const expected = { isValid: true };

        expect(got).toStrictEqual(expected);
    });

    it("invalid if slider out of range", () => {
        const xOnyxiaContext: XOnyxiaContextLike = {};

        const got = validateValueAgainstJSONSchema({
            helmValuesSchema: {
                type: "string",
                sliderMin: 2,
                sliderMax: 4,
                sliderUnit: "Gi"
            },
            xOnyxiaContext,
            value: "4.1Gi"
        });

        const expected = { isValid: false, reasonableApproximation: undefined };

        expect(got).toStrictEqual(expected);
    });

    it("invalid if slider out of range - below", () => {
        const xOnyxiaContext: XOnyxiaContextLike = {};

        const got = validateValueAgainstJSONSchema({
            helmValuesSchema: {
                type: "string",
                sliderMin: 2,
                sliderMax: 4,
                sliderUnit: "Gi"
            },
            xOnyxiaContext,
            value: "1.9Gi"
        });

        const expected = { isValid: false, reasonableApproximation: undefined };

        expect(got).toStrictEqual(expected);
    });

    it("valid if slider in range - with number", () => {
        const xOnyxiaContext: XOnyxiaContextLike = {};

        const got = validateValueAgainstJSONSchema({
            helmValuesSchema: {
                type: "number",
                sliderMin: 2,
                sliderMax: 4
            },
            xOnyxiaContext,
            value: 3
        });

        const expected = { isValid: true };

        expect(got).toStrictEqual(expected);
    });

    it("invalid if slider out of range - with number", () => {
        const xOnyxiaContext: XOnyxiaContextLike = {};

        const got = validateValueAgainstJSONSchema({
            helmValuesSchema: {
                type: "number",
                sliderMin: 2,
                sliderMax: 4
            },
            xOnyxiaContext,
            value: 4.1
        });

        const expected = { isValid: false, reasonableApproximation: undefined };

        expect(got).toStrictEqual(expected);
    });
});
