import { Footer } from "ui/App/Footer";
import { getStoryFactory } from "stories/getStory";
import { sectionName } from "./sectionName";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { Footer },
    "defaultContainerWidth": 1000,
    "doNeedCore": true
});

export default meta;

export const View1 = getStory({});
