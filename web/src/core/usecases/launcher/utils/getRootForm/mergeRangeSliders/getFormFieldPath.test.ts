import { symToStr } from "tsafe/symToStr";
import { it, expect, describe } from "vitest";
import { getFormFieldPath } from "./getFormFieldPath";

describe(symToStr({ getFormFieldPath }), () => {
    it("base case", () => {
        const targetField = {
            "type": "field"
        } as const;

        const got = getFormFieldPath({
            "formFieldGroup": {
                "type": "group",
                "children": [
                    {
                        "type": "field"
                    },
                    {
                        "type": "group",
                        "children": [
                            {
                                "type": "field"
                            },
                            {
                                "type": "group",
                                "children": [targetField]
                            }
                        ]
                    }
                ]
            },
            "predicate": formField => formField === targetField
        });

        const expected = [1, 1, 0];

        expect(got).toEqual(expected);
    });
});
