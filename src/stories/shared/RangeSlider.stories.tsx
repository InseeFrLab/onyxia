import { RangeSlider } from "app/components/shared/RangeSlider";
import type { RangeSliderProps } from "app/components/shared/RangeSlider";
import { sectionName } from "./sectionName";
import { getStoryFactory } from "stories/geStory";
import { useState } from "react";
import { symToStr } from "tsafe/symToStr";
import { useConstCallback } from "powerhooks/useConstCallback";

function Component(
    props: Omit<RangeSliderProps, "onValueChange" | "valueHigh" | "valueLow">,
) {
    const [valueLow, setValueLow] = useState(props.min);
    const [valueHigh, setValueHigh] = useState(props.max);

    const onValueChange = useConstCallback<RangeSliderProps["onValueChange"]>(
        ({ extremity, value }) => {
            switch (extremity) {
                case "low":
                    setValueLow(value);
                    break;
                case "high":
                    setValueHigh(value);
                    break;
            }
        },
    );

    return (
        <RangeSlider
            {...props}
            valueLow={valueLow}
            valueHigh={valueHigh}
            onValueChange={onValueChange}
        />
    );
}

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { [symToStr({ RangeSlider })]: Component },
});

export default meta;

export const Vue1 = getStory({
    "label": "Random-access memory (RAM)",
    "lowExtremitySemantic": "guaranteed",
    "highExtremitySemantic": "maximum",
    "unit": "Mi",
    "min": 1,
    "max": 200,
    "step": 1,
});
