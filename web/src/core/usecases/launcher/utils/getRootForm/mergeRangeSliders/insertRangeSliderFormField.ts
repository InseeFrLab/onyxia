import type { FormField, FormFieldGroup } from "../../../formTypes";
import { assert, type Equals } from "tsafe/assert";
import { is } from "tsafe/is";
import { getFormFieldAtPath } from "./getFormFieldAtPath";
import {
    helmValuesPathToFormFieldPath,
    FormFieldGroupLike as FormFieldGroupLike_helmValuesPathToFormFieldPath
} from "./helmValuesPathToFormFieldPath";
import { getHelmValuesPathDeeperCommonSubpath } from "./getHelmValuesPathDeeperCommonSubpath";

export type FormFieldGroupLike = FormFieldGroupLike_helmValuesPathToFormFieldPath;

assert<FormFieldGroup extends FormFieldGroupLike ? true : false>();

export type FormFieldRangeSliderLike = {
    lowEndRange: {
        helmValuesPath: (string | number)[];
    };
    highEndRange: {
        helmValuesPath: (string | number)[];
    };
};

assert<FormField.RangeSlider extends FormFieldRangeSliderLike ? true : false>();

export function insertRangeSliderFormField(params: {
    formFieldGroup: FormFieldGroupLike;
    rangeSliderFormField: FormFieldRangeSliderLike;
}): void {
    const { formFieldGroup, rangeSliderFormField } = params;

    console.log("a");

    const helmValuesPathToGroup = getHelmValuesPathDeeperCommonSubpath({
        "helmValuesPath1": rangeSliderFormField.lowEndRange.helmValuesPath,
        "helmValuesPath2": rangeSliderFormField.highEndRange.helmValuesPath
    });

    console.log("b", { helmValuesPathToGroup });

    const formFieldPath = helmValuesPathToFormFieldPath({
        "children": formFieldGroup.children,
        helmValuesPathToGroup
    });

    console.log("c");

    const formFieldGroup_target = getFormFieldAtPath({
        formFieldGroup,
        formFieldPath,
        "doExtract": false
    });

    assert(formFieldGroup_target.type === "group");

    assert<Equals<typeof rangeSliderFormField, FormFieldRangeSliderLike>>();
    assert(is<FormField.RangeSlider>(rangeSliderFormField));
    formFieldGroup_target.children.push(rangeSliderFormField);
}
