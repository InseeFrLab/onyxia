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

        expect(formFieldGroup.children[0]).toBe(rangeSliderFormField);
    });
});
