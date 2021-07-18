import { Footer } from "app/components/App/Footer";
import { getStoryFactory } from "stories/geStory";
import { sectionName } from "./sectionName";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { Footer },
});

export default meta;

export const Vue1 = getStory({
    "packageJsonVersion": "0.9.3",
    "tosUrl": "#",
    "contributeUrl": "#",
});
