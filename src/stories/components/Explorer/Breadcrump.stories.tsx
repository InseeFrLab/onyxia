

import { Breadcrump } from "app/components/Explorer/Breadcrump";
import { sectionName } from "./sectionName";
import { getStoryFactory, logCallbacks } from "stories/geStory";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { Breadcrump }
});

export default meta;

export const defaultView = getStory({
    "path": "aaa/bbb/cccc/dddd/foo.csv",
    "minDepth": 0,
    ...logCallbacks(["callback"])
});
