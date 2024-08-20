import { symToStr } from "tsafe/symToStr";
import { it, expect, describe } from "vitest";
import { helmValuesPathToFormFieldPath } from "./helmValuesPathToFormFieldPath";

describe(symToStr({ helmValuesPathToFormFieldPath }), () => {
    it("base case", () => {
        const got = helmValuesPathToFormFieldPath({
            "children": [
                {
                    "type": "group",
                    "helmValuesPathSegment": "a",
                    "children": [
                        {
                            "type": "field"
                        },
                        {
                            "type": "group",
                            "helmValuesPathSegment": "b",
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
                }
            ],
            "helmValuesPathToGroup": ["a", "b", 1, "c"]
        });

        const expected = [0, 1, 1, 0];

        expect(got).toEqual(expected);
    });
});
