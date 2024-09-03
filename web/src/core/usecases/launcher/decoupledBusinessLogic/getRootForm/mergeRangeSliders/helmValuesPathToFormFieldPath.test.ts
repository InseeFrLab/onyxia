import { symToStr } from "tsafe/symToStr";
import { it, expect, describe } from "vitest";
import { helmValuesPathToFormFieldPath } from "./helmValuesPathToFormFieldPath";

describe(symToStr({ helmValuesPathToFormFieldPath }), () => {
    it("root case", () => {
        const got = helmValuesPathToFormFieldPath({
            "formFieldGroup": {
                "type": "group",
                "helmValuesPath": [],
                "children": []
            },
            "helmValuesPathToGroup": []
        });

        const expected: number[] = [];

        expect(got).toStrictEqual(expected);
    });

    it("very simple case", () => {
        const got = helmValuesPathToFormFieldPath({
            "formFieldGroup": {
                "type": "group",
                "helmValuesPath": [],
                "children": [
                    { "type": "field" },
                    {
                        "type": "group",
                        "helmValuesPath": ["a"],
                        "children": []
                    }
                ]
            },
            "helmValuesPathToGroup": ["a"]
        });

        const expected: number[] = [1];

        expect(got).toStrictEqual(expected);
    });

    it("base case", () => {
        const got = helmValuesPathToFormFieldPath({
            "formFieldGroup": {
                "type": "group",
                "helmValuesPath": [],
                "children": [
                    {
                        "type": "field"
                    },
                    {
                        "type": "group",
                        "helmValuesPath": ["a"],
                        "children": [
                            {
                                "type": "field"
                            },
                            {
                                "type": "group",
                                "helmValuesPath": ["a", 1],
                                "children": [
                                    {
                                        "type": "group",
                                        "helmValuesPath": ["a", 1, "c"],
                                        "children": []
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },
            "helmValuesPathToGroup": ["a", 1, "c"]
        });

        const expected = [1, 1, 0];

        expect(got).toStrictEqual(expected);
    });
});
