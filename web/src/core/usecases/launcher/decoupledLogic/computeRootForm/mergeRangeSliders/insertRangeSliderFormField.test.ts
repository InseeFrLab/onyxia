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
            "helmValuesPath": [],
            "children": [
                {
                    "type": "group",
                    "helmValuesPath": ["resources"],
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

        expect(formFieldGroup).toStrictEqual({
            "type": "group",
            "helmValuesPath": [],
            "children": [
                {
                    "type": "group",
                    "helmValuesPath": ["resources"],
                    "children": [rangeSliderFormField]
                }
            ]
        });
    });

    it("root case", () => {
        const formFieldGroup: FormFieldGroupLike = {
            "type": "group",
            "helmValuesPath": [],
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

        expect(formFieldGroup).toStrictEqual({
            "type": "group",
            "helmValuesPath": [],
            "children": [rangeSliderFormField]
        });
    });
});
