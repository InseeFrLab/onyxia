import { symToStr } from "tsafe/symToStr";
import { it, expect, describe } from "vitest";
import { getFormFieldAtPath, type FormFieldGroupLike } from "./getFormFieldAtPath";

describe(symToStr({ getFormFieldAtPath }), () => {
    it("no extract", () => {
        const targetFormFieldGroup: FormFieldGroupLike = {
            "type": "group",
            "children": []
        };

        const formFieldGroup: FormFieldGroupLike = {
            "type": "group",
            "children": [
                {
                    "type": "field"
                },
                {
                    "type": "group",
                    "children": [
                        targetFormFieldGroup,
                        {
                            "type": "field"
                        }
                    ]
                },
                {
                    "type": "field"
                }
            ]
        };

        const got = getFormFieldAtPath({
            "doExtract": false,
            formFieldGroup,
            "formFieldPath": [1, 0]
        });

        const expected = targetFormFieldGroup;

        expect(got).toBe(expected);
    });

    it("with extract", () => {
        const targetFormFieldGroup: FormFieldGroupLike = {
            "type": "group",
            "children": []
        };

        const formFieldGroup: FormFieldGroupLike = {
            "type": "group",
            "children": [
                {
                    "type": "field"
                },
                {
                    "type": "group",
                    "children": [
                        targetFormFieldGroup,
                        {
                            "type": "field"
                        }
                    ]
                },
                {
                    "type": "field"
                }
            ]
        };

        const got = getFormFieldAtPath({
            "doExtract": true,
            formFieldGroup,
            "formFieldPath": [1, 0]
        });

        expect(formFieldGroup).toEqual({
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
                        }
                    ]
                },
                {
                    "type": "field"
                }
            ]
        });

        const expected = targetFormFieldGroup;

        expect(got).toBe(expected);
    });
});
