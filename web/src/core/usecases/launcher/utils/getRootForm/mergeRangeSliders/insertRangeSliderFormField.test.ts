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
            "helmValuesPathSegment": "resources",
            "children": []
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
            "helmValuesPathSegment": "resources",
            "children": [rangeSliderFormField]
        });
    });

    it("subtree case", () => {
        const formFieldGroup: FormFieldGroupLike = {
            "type": "group",
            "helmValuesPathSegment": "resources",
            "children": [
                {
                    "type": "group",
                    "helmValuesPathSegment": "xxx",
                    "children": []
                }
            ]
        };

        const rangeSliderFormField: FormFieldRangeSliderLike = {
            "lowEndRange": {
                "helmValuesPath": ["resources", "xxx", "requests", "cpu"]
            },
            "highEndRange": {
                "helmValuesPath": ["resources", "xxx", "limits", "cpu"]
            }
        };

        insertRangeSliderFormField({
            formFieldGroup,
            rangeSliderFormField
        });

        expect(formFieldGroup).toEqual({
            "type": "group",
            "helmValuesPathSegment": "resources",
            "children": [
                {
                    "type": "group",
                    "helmValuesPathSegment": "xxx",
                    "children": [rangeSliderFormField]
                }
            ]
        });
    });
});
