

import { Typography, defaultProps } from "app/components/designSystem/Typography";
import { sectionName } from "./sectionName";
import { getStoryFactory } from "stories/geStory";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { Typography }
});

export default meta;

export const Vue1 = getStory({
    ...defaultProps,
    "children": "Foo bar"
});

