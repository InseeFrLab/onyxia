import App from "ui/App";
import { getStoryFactory } from "stories/getStory";
import { sectionName } from "./sectionName";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { App },
    "doUseLib": true
});

export default meta;

export const View1 = getStory({});
