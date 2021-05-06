
import { Footer } from "app/components/App/Footer";
import { getStoryFactory } from "stories/geStory";
import { sectionName } from "./sectionName";
import { css } from "tss-react";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { Footer }
});

export default meta;

export const Vue1 = getStory({
    "className": css({ "height": 32, "width": 1100 }),
    "onyxiaUiVersion": "0.9.3",
    "tosHref": "#",
    "contributeHref": "#"
});

