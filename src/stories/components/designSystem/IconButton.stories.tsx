

import { IconButton, defaultProps } from "app/components/designSystem/IconButton";
import { sectionName } from "./sectionName";
import { getStoryFactory, logCallbacks } from "stories/geStory";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { IconButton }
});

export default meta;


export const Vue1 = getStory({
    ...defaultProps,
    "type": "add",
    ...logCallbacks(["onClick"])
});

