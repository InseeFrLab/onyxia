import type { FormField } from "../../formTypes";
import { assert } from "tsafe/assert";

export type TemporaryRangeSliderPayload = {
    isReadonly: boolean;
    sliderMin: number;
    sliderMax: number;
    sliderStep: number | undefined;
    sliderUnit: string | undefined;
    sliderExtremitySemantic: string | undefined;
    sliderRangeId: string;
    helmValue: string | number;
    helmValuesPath: (string | number)[];
    description: string | undefined;
    isHidden: boolean;
} & (
    | {
          sliderExtremity: "down";
          title: string;
      }
    | {
          sliderExtremity: "up";
      }
);

const prefix = "xMePsKssR9p9e";

export function getIsTemporaryRangeSlider(params: {
    rangeSlider: FormField.RangeSlider;
}) {
    const { rangeSlider } = params;

    return rangeSlider.unit?.startsWith(prefix);
}

export function getTemporaryRangeSliderPayload(params: {
    temporaryRangeSlider: FormField.RangeSlider;
}): TemporaryRangeSliderPayload {
    const { temporaryRangeSlider } = params;

    assert(temporaryRangeSlider.unit !== undefined);
    assert(temporaryRangeSlider.unit.startsWith(prefix));

    return JSON.parse(temporaryRangeSlider.unit.slice(prefix.length));
}

export function createTemporaryRangeSlider(params: {
    payload: TemporaryRangeSliderPayload;
}): FormField.RangeSlider {
    const { payload } = params;

    return {
        type: "field",
        title: "",
        fieldType: "range slider",
        lowEndRange: {
            isReadonly: false,
            helmValuesPath: [],
            value: NaN,
            description: undefined,
            rangeEndSemantic: undefined,
            min: NaN,
            max: NaN
        },
        highEndRange: {
            isReadonly: false,
            helmValuesPath: [],
            value: NaN,
            description: undefined,
            rangeEndSemantic: undefined,
            min: NaN,
            max: NaN
        },
        unit: prefix + JSON.stringify(payload),
        step: NaN,
        isHidden: false
    };
}
