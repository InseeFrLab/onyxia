import type { FormFieldGroup } from "../../formTypes";
import { assert } from "tsafe/assert";
import {
    removeFormFieldGroupWithNoNodes,
    type FormFieldGroupLike as FormFieldGroupLike_removeFormFieldGroupWithNoNodes
} from "./removeFormFieldGroupWithNoNodes";
import {
    getFormFieldPath,
    type FormFieldGroupLike as FormFieldGroupLike_getFormFieldPath
} from "./getFormFieldPath";
import {
    getFormFieldAtPath,
    type FormFieldGroupLike as FormFieldGroupLike_getFormFieldAtPath
} from "./getFormFieldAtPath";
import {
    getTemporaryRangeSliderPayload,
    getIsTemporaryRangeSlider
} from "./temporaryRangeSlider";
import { mergeTemporaryRangeSliders } from "./mergeTemporaryRangeSliders";
import {
    insertRangeSliderFormField,
    type FormFieldGroupLike as FormFieldGroupLike_insertRangeSliderFormField
} from "./insertRangeSliderFormField";

export type FormFieldGroupLike = FormFieldGroupLike_getFormFieldPath &
    FormFieldGroupLike_getFormFieldAtPath &
    FormFieldGroupLike_insertRangeSliderFormField &
    FormFieldGroupLike_removeFormFieldGroupWithNoNodes;

assert<FormFieldGroup extends FormFieldGroupLike ? true : false>();

export function mergeRangeSliders(params: { formFieldGroup: FormFieldGroupLike }): void {
    const { formFieldGroup } = params;

    while (true) {
        const lowerBoundPath = getFormFieldPath({
            formFieldGroup,
            predicate: formField => {
                if (formField.fieldType !== "range slider") {
                    return false;
                }

                if (!getIsTemporaryRangeSlider({ rangeSlider: formField })) {
                    return false;
                }

                const { sliderExtremity } = getTemporaryRangeSliderPayload({
                    temporaryRangeSlider: formField
                });

                return sliderExtremity === "down";
            }
        });

        if (lowerBoundPath === undefined) {
            break;
        }

        const temporaryRangeSlider_lowerBound = getFormFieldAtPath({
            formFieldGroup,
            formFieldPath: lowerBoundPath,
            doExtract: true
        });

        assert(temporaryRangeSlider_lowerBound.type === "field");
        assert(temporaryRangeSlider_lowerBound.fieldType === "range slider");

        const { sliderRangeId } = getTemporaryRangeSliderPayload({
            temporaryRangeSlider: temporaryRangeSlider_lowerBound
        });

        const higherBoundPath = getFormFieldPath({
            formFieldGroup,
            predicate: formField => {
                if (formField.fieldType !== "range slider") {
                    return false;
                }

                if (!getIsTemporaryRangeSlider({ rangeSlider: formField })) {
                    return false;
                }

                const { sliderExtremity, sliderRangeId: sliderRangeId_i } =
                    getTemporaryRangeSliderPayload({
                        temporaryRangeSlider: formField
                    });

                return sliderExtremity === "up" && sliderRangeId_i === sliderRangeId;
            }
        });

        assert(higherBoundPath !== undefined);

        const temporaryRangeSlider_higherBound = getFormFieldAtPath({
            formFieldGroup,
            formFieldPath: higherBoundPath,
            doExtract: true
        });

        assert(temporaryRangeSlider_higherBound.type === "field");
        assert(temporaryRangeSlider_higherBound.fieldType === "range slider");

        const rangeSlider = mergeTemporaryRangeSliders({
            temporaryRangeSlider_lowerBound,
            temporaryRangeSlider_higherBound
        });

        insertRangeSliderFormField({
            formFieldGroup,
            rangeSliderFormField: rangeSlider
        });
    }

    removeFormFieldGroupWithNoNodes({ nodes: formFieldGroup.nodes });
}
