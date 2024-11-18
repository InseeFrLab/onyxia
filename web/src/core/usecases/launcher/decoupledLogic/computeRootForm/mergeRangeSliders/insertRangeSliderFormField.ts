import type { FormField, FormFieldGroup } from "../../formTypes";
import { assert, type Equals, is } from "tsafe/assert";
import { getFormFieldAtPath } from "./getFormFieldAtPath";
import {
    helmValuesPathToFormFieldPath,
    FormFieldGroupLike as FormFieldGroupLike_helmValuesPathToFormFieldPath
} from "./helmValuesPathToFormFieldPath";
import { getHelmValuesPathDeeperCommonSubpath } from "../../shared/getHelmValuesPathDeeperCommonSubpath";

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

    const helmValuesPathToGroup = getHelmValuesPathDeeperCommonSubpath({
        helmValuesPath1: rangeSliderFormField.lowEndRange.helmValuesPath,
        helmValuesPath2: rangeSliderFormField.highEndRange.helmValuesPath
    });

    const formFieldPath = helmValuesPathToFormFieldPath({
        formFieldGroup,
        helmValuesPathToGroup
    });

    const formFieldGroup_target = getFormFieldAtPath({
        formFieldGroup,
        formFieldPath,
        doExtract: false
    });

    assert(formFieldGroup_target.type === "group");

    assert<Equals<typeof rangeSliderFormField, FormFieldRangeSliderLike>>();
    assert(is<FormField.RangeSlider>(rangeSliderFormField));
    formFieldGroup_target.nodes.push(rangeSliderFormField);
}
