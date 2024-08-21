import { symToStr } from "tsafe/symToStr";
import { it, expect, describe } from "vitest";
import { helmValuesPathToFormFieldPath } from "./helmValuesPathToFormFieldPath";

describe(symToStr({ helmValuesPathToFormFieldPath }), () => {
    it("root case", () => {
        const got = helmValuesPathToFormFieldPath({
            "formFieldGroup": {
                "type": "group",
                "helmValuesPathSegment": "root",
                "children": []
            },
            "helmValuesPathToGroup": []
        });

        const expected: number[] = [];

        expect(got).toEqual(expected);
    });

    it("very simple case", () => {
        const got = helmValuesPathToFormFieldPath({
            "formFieldGroup": {
                "type": "group",
                "helmValuesPathSegment": "root",
                "children": [
                    { "type": "field" },
                    {
                        "type": "group",
                        "helmValuesPathSegment": "a",
                        "children": []
                    }
                ]
            },
            "helmValuesPathToGroup": ["a"]
        });

        const expected: number[] = [1];

        expect(got).toEqual(expected);
    });

    it("base case", () => {
        const got = helmValuesPathToFormFieldPath({
            "formFieldGroup": {
                "type": "group",
                "helmValuesPathSegment": "root",
                "children": [
                    {
                        "type": "field"
                    },
                    {
                        "type": "group",
                        "helmValuesPathSegment": "a",
                        "children": [
                            {
                                "type": "field"
                            },
                            {
                                "type": "group",
                                "helmValuesPathSegment": 1,
                                "children": [
                                    {
                                        "type": "group",
                                        "helmValuesPathSegment": "c",
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

        expect(got).toEqual(expected);
    });
});
