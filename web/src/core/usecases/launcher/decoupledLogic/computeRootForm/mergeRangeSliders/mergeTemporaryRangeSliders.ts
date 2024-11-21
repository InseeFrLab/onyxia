import type { FormField } from "core/usecases/launcher/decoupledLogic/formTypes";
import { assert } from "tsafe/assert";
import { id } from "tsafe/id";
import { getTemporaryRangeSliderPayload } from "./temporaryRangeSlider";

export function mergeTemporaryRangeSliders(params: {
    temporaryRangeSlider_lowerBound: FormField.RangeSlider;
    temporaryRangeSlider_higherBound: FormField.RangeSlider;
}): FormField.RangeSlider {
    const payload_lowEnd = getTemporaryRangeSliderPayload({
        temporaryRangeSlider: params.temporaryRangeSlider_lowerBound
    });

    assert(payload_lowEnd.sliderExtremity === "down");

    const payload_highEnd = getTemporaryRangeSliderPayload({
        temporaryRangeSlider: params.temporaryRangeSlider_higherBound
    });

    assert(payload_highEnd.sliderExtremity === "up");

    const title = payload_lowEnd.title;

    const unit = (() => {
        const unit_lowerBound = payload_lowEnd.sliderUnit;
        const unit_higherBound = payload_highEnd.sliderUnit;

        if (unit_lowerBound === undefined && unit_higherBound === undefined) {
            return undefined;
        }

        if (
            unit_lowerBound !== undefined &&
            unit_higherBound !== undefined &&
            unit_lowerBound !== unit_higherBound
        ) {
            throw new Error(
                `Both extremities of the ${title} range slider have different units: ${unit_lowerBound} and ${unit_higherBound}`
            );
        }

        return unit_lowerBound ?? unit_higherBound;
    })();

    return {
        type: "field",
        title,
        fieldType: "range slider",
        unit,
        step: (() => {
            const step_lowerBound = payload_highEnd.sliderStep;
            const step_higherBound = payload_lowEnd.sliderStep;

            if (step_lowerBound === undefined && step_higherBound === undefined) {
                throw new Error(
                    `Both extremities of the ${title} range slider have no step`
                );
            }

            if (
                step_lowerBound !== undefined &&
                step_higherBound !== undefined &&
                step_lowerBound !== step_higherBound
            ) {
                throw new Error(
                    `Both extremities of the ${title} range slider have different steps: ${step_lowerBound} and ${step_higherBound}`
                );
            }

            const value = step_lowerBound ?? step_higherBound;

            assert(value !== undefined);

            return value;
        })(),
        ...(() => {
            const [lowEndRange, highEndRange] = (["lowEnd", "highEnd"] as const)
                .map(rangeEndName => {
                    switch (rangeEndName) {
                        case "lowEnd":
                            return payload_lowEnd;
                        case "highEnd":
                            return payload_highEnd;
                    }
                })
                .map(payload => {
                    const { value } = (() => {
                        const { helmValue } = payload;

                        if (typeof helmValue === "number") {
                            assert(unit === undefined || unit === "");
                            return { value: helmValue };
                        }

                        let helmValue_withoutUnit;

                        remove_unit: {
                            if (unit === undefined) {
                                helmValue_withoutUnit = helmValue;
                                break remove_unit;
                            }

                            assert(helmValue.endsWith(unit));

                            helmValue_withoutUnit =
                                unit === ""
                                    ? helmValue
                                    : helmValue.slice(0, -unit.length);
                        }

                        const value = parseFloat(helmValue_withoutUnit);

                        assert(!isNaN(value), `Invalid number: ${helmValue_withoutUnit}`);

                        return { value };
                    })();

                    return id<FormField.RangeSlider.RangeEnd>({
                        isReadonly: payload.isReadonly,
                        helmValuesPath: payload.helmValuesPath,
                        value,
                        rangeEndSemantic: payload.sliderExtremitySemantic,
                        min: payload.sliderMin,
                        max: payload.sliderMax,
                        description: payload.description
                    });
                });

            return {
                lowEndRange,
                highEndRange
            };
        })()
    };
}
