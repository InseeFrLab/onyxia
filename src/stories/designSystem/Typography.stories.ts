

import { Typography, defaultProps } from "app/components/designSystem/Typography";
import { sectionName } from "./sectionName";
import { getStoryFactory } from "stories/geStory";

const { meta, getThemedStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { Typography }
});

export default meta;

export const Vue1 = getThemedStory({
    ...defaultProps,
    "children": "Foo bar"
});

