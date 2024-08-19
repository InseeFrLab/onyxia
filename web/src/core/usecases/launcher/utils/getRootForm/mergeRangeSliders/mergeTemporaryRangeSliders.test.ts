import { mergeTemporaryRangeSliders } from "./mergeTemporaryRangeSliders";
import { createTemporaryRangeSlider } from "./temporaryRangeSlider";
import { symToStr } from "tsafe/symToStr";
import { it, expect, describe } from "vitest";
import type { FormField } from "core/usecases/launcher/formTypes";

describe(symToStr({ mergeTemporaryRangeSliders }), () => {
    it("base case", () => {
        const expected: FormField.RangeSlider = {
            "type": "field",
            "title": "CPU",
            "fieldType": "range slider",
            "unit": "m",
            "step": 50,
            "lowEndRange": {
                "helmValuesPath": ["resources", "requests", "cpu"],
                "value": 150,
                "rangeEndSemantic": "guaranteed",
                "min": 50,
                "max": 40000,
                "description": "The amount of cpu guaranteed"
            },
            "highEndRange": {
                "helmValuesPath": ["resources", "limits", "cpu"],
                "value": 30000,
                "rangeEndSemantic": "Maximum",
                "min": 50,
                "max": 40000,
                "description": "The maximum amount of cpu"
            }
        };

        const got = mergeTemporaryRangeSliders({
            "temporaryRangeSlider_lowerBound": createTemporaryRangeSlider({
                "payload": {
                    "sliderMin": 50,
                    "sliderMax": 40000,
                    "sliderStep": 50,
                    "sliderUnit": "m",
                    "sliderExtremitySemantic": "guaranteed",
                    "sliderRangeId": "cpu",
                    "helmValue": "150m",
                    "helmValuesPath": ["resources", "requests", "cpu"],
                    "description": "The amount of cpu guaranteed",
                    "sliderExtremity": "down",
                    "title": "CPU"
                }
            }),
            "temporaryRangeSlider_higherBound": createTemporaryRangeSlider({
                "payload": {
                    "sliderMin": 50,
                    "sliderMax": 40000,
                    "sliderStep": 50,
                    "sliderUnit": "m",
                    "sliderExtremitySemantic": "Maximum",
                    "sliderRangeId": "cpu",
                    "helmValue": "30000m",
                    "helmValuesPath": ["resources", "limits", "cpu"],
                    "description": "The maximum amount of cpu",
                    "sliderExtremity": "up"
                }
            })
        });

        expect(got).toEqual(expected);
    });
});
