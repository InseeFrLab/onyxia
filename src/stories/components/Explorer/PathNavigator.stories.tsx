

import { PathNavigator } from "app/components/Explorer/PathNavigator";
import { sectionName } from "./sectionName";
import { getStoryFactory } from "stories/geStory";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { PathNavigator }
});

export default meta;

export const defaultView = getStory({
    "path": "a/b/c/d/foo.csv",
    "minDepth": 0,
    "callback": console.log.bind(console, "callback")
});
