import { it, expect, describe } from "vitest";
import { resolveEnum, type XOnyxiaContextLike } from "./resolveEnum";
import { symToStr } from "tsafe/symToStr";

describe(symToStr({ resolveEnum }), () => {
    it("resolves from the xOnyxiaContext", () => {
        const xOnyxiaContext: XOnyxiaContextLike = {
            user: {
                decodedIdToken: {
                    groups: ["a", "b", "c"]
                }
            }
        };

        const got = resolveEnum({
            helmValuesSchema: {
                type: "string",
                "x-onyxia": {
                    overwriteListEnumWith: "user.decodedIdToken.groups"
                }
            },
            xOnyxiaContext
        });

        const expected = ["a", "b", "c"];

        expect(got).toStrictEqual(expected);
    });

    it("resolves from the xOnyxiaContext with array", () => {
        const xOnyxiaContext: XOnyxiaContextLike = {
            user: {
                decodedIdToken: {
                    group1: "a",
                    group2: "b"
                }
            }
        };

        const got = resolveEnum({
            helmValuesSchema: {
                type: "string",
                "x-onyxia": {
                    overwriteListEnumWith: [
                        "{{user.decodedIdToken.group1}}",
                        "{{user.decodedIdToken.group2}}",
                        "c"
                    ]
                }
            },
            xOnyxiaContext
        });

        const expected = ["a", "b", "c"];

        expect(got).toStrictEqual(expected);
    });

    it("approximates values from xOnyxiaContext", () => {
        const xOnyxiaContext: XOnyxiaContextLike = {
            user: {
                decodedIdToken: {
                    groups: ["1", "2", 3]
                }
            }
        };

        const got = resolveEnum({
            helmValuesSchema: {
                type: "number",
                "x-onyxia": {
                    overwriteListEnumWith: "user.decodedIdToken.groups"
                }
            },
            xOnyxiaContext
        });

        const expected = [1, 2, 3];

        expect(got).toStrictEqual(expected);
    });

    it("works recursively", () => {
        const xOnyxiaContext: XOnyxiaContextLike = {
            r: [
                [1, 2, 3],
                [4, "5", 6]
            ]
        };

        const got = resolveEnum({
            helmValuesSchema: {
                type: "array",
                items: {
                    type: "number",
                    enum: [1, 2, 3, 4, 5, 6]
                },
                "x-onyxia": {
                    overwriteListEnumWith: "r"
                }
            },
            xOnyxiaContext
        });

        const expected = [
            [1, 2, 3],
            [4, 5, 6]
        ];

        expect(got).toStrictEqual(expected);
    });

    it("keeps valid options from xOnyxia even if not all valid", () => {
        const xOnyxiaContext: XOnyxiaContextLike = {
            r: [
                [1, 2, 3],
                [4, "5", 6]
            ]
        };

        const got = resolveEnum({
            helmValuesSchema: {
                type: "array",
                items: {
                    type: "number",
                    enum: [2, 3, 4, 5, 6]
                },
                listEnum: [
                    [2, 2, 2],
                    [3, 3, 3]
                ],
                "x-onyxia": {
                    overwriteListEnumWith: "r"
                }
            },
            xOnyxiaContext
        });

        const expected = [[4, 5, 6]];

        expect(got).toStrictEqual(expected);
    });

    it("falls back to listEnum when xOnyxia resolved has 0 valid options", () => {
        const xOnyxiaContext: XOnyxiaContextLike = {
            r: [
                [7, 7, 7],
                [8, 8, 8]
            ]
        };

        const got = resolveEnum({
            helmValuesSchema: {
                type: "array",
                items: {
                    type: "number",
                    enum: [2, 3, 4, 5, 6]
                },
                listEnum: [
                    [2, 2, 2],
                    [3, 3, 3]
                ],
                "x-onyxia": {
                    overwriteListEnumWith: "r"
                }
            },
            xOnyxiaContext
        });

        const expected = [
            [2, 2, 2],
            [3, 3, 3]
        ];

        expect(got).toStrictEqual(expected);
    });

    it("fallback to enum", () => {
        const xOnyxiaContext: XOnyxiaContextLike = {};

        const got = resolveEnum({
            helmValuesSchema: {
                type: "string",
                listEnum: [1, 2, 3],
                enum: ["a", "b", "c"],
                "x-onyxia": {
                    overwriteListEnumWith: "user.decodedIdToken.groups"
                }
            },
            xOnyxiaContext
        });

        const expected = ["a", "b", "c"];

        expect(got).toStrictEqual(expected);
    });

    it("do not crash is not render list and all invalid", () => {
        const xOnyxiaContext: XOnyxiaContextLike = {};

        const got = resolveEnum({
            helmValuesSchema: {
                type: "string",
                listEnum: [1, 2, 3],
                enum: ["a", "b", 3],
                "x-onyxia": {
                    overwriteListEnumWith: "user.decodedIdToken.groups"
                }
            },
            xOnyxiaContext
        });

        const expected = undefined;

        expect(got).toStrictEqual(expected);
    });

    it("crash if no options and render is list", () => {
        const xOnyxiaContext: XOnyxiaContextLike = {};

        expect(() => {
            resolveEnum({
                helmValuesSchema: {
                    type: "string",
                    render: "list",
                    listEnum: [1, 2, 3],
                    enum: ["a", "b", 3]
                },
                xOnyxiaContext
            });
        }).toThrowError();
    });

    it("gives undefined if render isn't list and not valid", () => {
        const xOnyxiaContext: XOnyxiaContextLike = {};

        const got = resolveEnum({
            helmValuesSchema: {
                type: "number",
                enum: [1, 2, "not a number"]
            },
            xOnyxiaContext
        });

        const expected = undefined;

        expect(got).toStrictEqual(expected);
    });

    it("does not approximate when not xOnyxia", () => {
        const xOnyxiaContext: XOnyxiaContextLike = {};

        const got = resolveEnum({
            helmValuesSchema: {
                type: "number",
                enum: [1, 2, "3"]
            },
            xOnyxiaContext
        });

        const expected = undefined;

        expect(got).toStrictEqual(expected);
    });
});
