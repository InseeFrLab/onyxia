import { SimpleSlider } from "app/components/shared/SimpleSlider";
import type { SimpleSliderProps } from "app/components/shared/SimpleSlider";
import { sectionName } from "./sectionName";
import { getStoryFactory } from "stories/geStory";
import { useState } from "react";
import { symToStr } from "tsafe/symToStr";

function Component(props: Omit<SimpleSliderProps, "onValueChange" | "value">) {
    const [value, setValue] = useState(props.min);
    return <SimpleSlider {...props} value={value} onValueChange={setValue} />;
}

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { [symToStr({ SimpleSlider })]: Component },
});

export default meta;

export const Vue1 = getStory({
    "label": "Random-access memory (RAM)",
    "semantic": "maximum",
    "unit": "Mi",
    "min": 1,
    "max": 200,
    "step": 1,
});

export const VueNoSemantic = getStory({
    "label": "Random-access memory (RAM)",
    "unit": "Mi",
    "min": 1,
    "max": 200,
    "step": 1,
});
