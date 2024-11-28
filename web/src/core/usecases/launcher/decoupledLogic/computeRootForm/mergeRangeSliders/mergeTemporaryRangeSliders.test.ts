import { mergeTemporaryRangeSliders } from "./mergeTemporaryRangeSliders";
import { createTemporaryRangeSlider } from "./temporaryRangeSlider";
import { symToStr } from "tsafe/symToStr";
import { it, expect, describe } from "vitest";
import type { FormField } from "core/usecases/launcher/decoupledLogic/formTypes";

describe(symToStr({ mergeTemporaryRangeSliders }), () => {
    it("base case", () => {
        const expected: FormField.RangeSlider = {
            type: "field",
            title: "CPU",
            fieldType: "range slider",
            unit: "m",
            step: 50,
            lowEndRange: {
                isReadonly: false,
                helmValuesPath: ["resources", "requests", "cpu"],
                value: 150,
                rangeEndSemantic: "guaranteed",
                min: 50,
                max: 40000,
                description: "The amount of cpu guaranteed"
            },
            highEndRange: {
                isReadonly: false,
                helmValuesPath: ["resources", "limits", "cpu"],
                value: 30000,
                rangeEndSemantic: "Maximum",
                min: 50,
                max: 40000,
                description: "The maximum amount of cpu"
            },
            isHidden: false
        };

        const got = mergeTemporaryRangeSliders({
            temporaryRangeSlider_lowerBound: createTemporaryRangeSlider({
                payload: {
                    isReadonly: false,
                    sliderMin: 50,
                    sliderMax: 40000,
                    sliderStep: 50,
                    sliderUnit: "m",
                    sliderExtremitySemantic: "guaranteed",
                    sliderRangeId: "cpu",
                    helmValue: "150m",
                    helmValuesPath: ["resources", "requests", "cpu"],
                    description: "The amount of cpu guaranteed",
                    sliderExtremity: "down",
                    title: "CPU",
                    isHidden: false
                }
            }),
            temporaryRangeSlider_higherBound: createTemporaryRangeSlider({
                payload: {
                    isReadonly: false,
                    sliderMin: 50,
                    sliderMax: 40000,
                    sliderStep: 50,
                    sliderUnit: "m",
                    sliderExtremitySemantic: "Maximum",
                    sliderRangeId: "cpu",
                    helmValue: "30000m",
                    helmValuesPath: ["resources", "limits", "cpu"],
                    description: "The maximum amount of cpu",
                    sliderExtremity: "up",
                    isHidden: false
                }
            })
        });

        expect(got).toStrictEqual(expected);
    });
});
