import { LeftBar } from "app/components/App/LeftBar";
import { getStoryFactory, logCallbacks } from "stories/geStory";
import { sectionName } from "./sectionName";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { LeftBar },
});

export default meta;

export const Vue1 = getStory({
    "collapsedWidth": 100,
    "currentPage": "home",
    ...logCallbacks(["onClick"]),
});
