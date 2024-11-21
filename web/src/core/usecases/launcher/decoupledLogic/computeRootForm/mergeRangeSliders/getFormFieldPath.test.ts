import { symToStr } from "tsafe/symToStr";
import { it, expect, describe } from "vitest";
import { getFormFieldPath } from "./getFormFieldPath";

describe(symToStr({ getFormFieldPath }), () => {
    it("base case", () => {
        const targetField = {
            type: "field"
        } as const;

        const got = getFormFieldPath({
            formFieldGroup: {
                type: "group",
                nodes: [
                    {
                        type: "field"
                    },
                    {
                        type: "group",
                        nodes: [
                            {
                                type: "field"
                            },
                            {
                                type: "group",
                                nodes: [targetField]
                            }
                        ]
                    }
                ]
            },
            predicate: formField => formField === targetField
        });

        const expected = [1, 1, 0];

        expect(got).toStrictEqual(expected);
    });
});
