import type { FormField } from "../../../formTypes";
import { assert } from "tsafe/assert";

export type TemporaryRangeSliderPayload = {
    sliderMin: number;
    sliderMax: number;
    sliderStep?: number;
    sliderUnit?: string;
    sliderExtremitySemantic?: string;
    sliderRangeId: string;
    helmValue: string | number;
    helmValuesPath: (string | number)[];
    description?: string;
} & (
    | {
          sliderExtremity: "down";
          title: string;
      }
    | {
          sliderExtremity: "up";
      }
);

export function getTemporaryRangeSliderPayload(params: {
    temporaryRangeSlider: FormField.RangeSlider;
}): TemporaryRangeSliderPayload {
    const { temporaryRangeSlider } = params;

    assert(temporaryRangeSlider.unit !== undefined);

    return JSON.parse(temporaryRangeSlider.unit);
}

export function createTemporaryRangeSlider(params: {
    payload: TemporaryRangeSliderPayload;
    title: string;
}): FormField.RangeSlider {
    const { title, payload } = params;

    return {
        "type": "field",
        title,
        "fieldType": "range slider",
        "lowEndRange": {
            "helmValuesPath": [],
            "value": NaN,
            "description": undefined,
            "rangeEndSemantic": undefined,
            "min": NaN,
            "max": NaN
        },
        "highEndRange": {
            "helmValuesPath": [],
            "value": NaN,
            "description": undefined,
            "rangeEndSemantic": undefined,
            "min": NaN,
            "max": NaN
        },
        "unit": JSON.stringify(payload),
        "step": NaN
    };
}
