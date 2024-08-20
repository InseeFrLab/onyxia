import type { FormFieldGroup, FormField } from "../../../formTypes";
import { assert } from "tsafe/assert";
import { getFormFieldAtPath } from "./getFormFieldAtPath";
import { helmValuesPathToFormFieldPath } from "./helmValuesPathToFormFieldPath";
import { getHelmValuesPathDeeperCommonSubpath } from "./getHelmValuesPathDeeperCommonSubpath";

export function insertRangeSliderFormField(params: {
    formFieldGroup: FormFieldGroup;
    rangeSliderFormField: FormField.RangeSlider;
}): void {
    const { formFieldGroup, rangeSliderFormField } = params;

    const formFieldPath = helmValuesPathToFormFieldPath({
        "children": formFieldGroup.children,
        "helmValuesPathToGroup": getHelmValuesPathDeeperCommonSubpath({
            "helmValuesPath1": rangeSliderFormField.lowEndRange.helmValuesPath,
            "helmValuesPath2": rangeSliderFormField.highEndRange.helmValuesPath
        })
    });

    const formFieldGroup_target = getFormFieldAtPath({
        formFieldGroup,
        formFieldPath,
        "doExtract": false
    });

    assert(formFieldGroup_target.type === "group");

    formFieldGroup_target.children.push(rangeSliderFormField);
}
