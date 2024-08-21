import { symToStr } from "tsafe/symToStr";
import { it, expect, describe } from "vitest";
import {
    insertRangeSliderFormField,
    type FormFieldGroupLike,
    type FormFieldRangeSliderLike
} from "./insertRangeSliderFormField";

describe(symToStr({ insertRangeSliderFormField }), () => {
    it("base case", () => {
        const formFieldGroup: FormFieldGroupLike = {
            "type": "group",
            "helmValuesPathSegment": "root",
            "children": [
                {
                    "type": "group",
                    "helmValuesPathSegment": "resources",
                    "children": []
                }
            ]
        };

        const rangeSliderFormField: FormFieldRangeSliderLike = {
            "lowEndRange": {
                "helmValuesPath": ["resources", "requests", "cpu"]
            },
            "highEndRange": {
                "helmValuesPath": ["resources", "limits", "cpu"]
            }
        };

        insertRangeSliderFormField({
            formFieldGroup,
            rangeSliderFormField
        });

        expect(formFieldGroup).toEqual({
            "type": "group",
            "helmValuesPathSegment": "root",
            "children": [
                {
                    "type": "group",
                    "helmValuesPathSegment": "resources",
                    "children": [rangeSliderFormField]
                }
            ]
        });
    });

    it("root case", () => {
        const formFieldGroup: FormFieldGroupLike = {
            "type": "group",
            "helmValuesPathSegment": "root",
            "children": []
        };

        const rangeSliderFormField: FormFieldRangeSliderLike = {
            "lowEndRange": {
                "helmValuesPath": ["resources-requests", "cpu"]
            },
            "highEndRange": {
                "helmValuesPath": ["resources-limits", "cpu"]
            }
        };

        insertRangeSliderFormField({
            formFieldGroup,
            rangeSliderFormField
        });

        expect(formFieldGroup).toEqual({
            "type": "group",
            "helmValuesPathSegment": "root",
            "children": [rangeSliderFormField]
        });
    });
});
