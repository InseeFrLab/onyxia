import { App } from "app/components/App";
import { getStoryFactory } from "stories/getStory";
import { sectionName } from "./sectionName";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { App },
    "doProvideMockStore": true,
});

export default meta;

export const Vue1 = getStory({});
