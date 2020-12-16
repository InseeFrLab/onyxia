

import { Typography, defaultProps } from "app/components/designSystem/Typography";
import { sectionName } from "./sectionName";
import { getThemedStoryFactory } from "stories/utils/getThemedStory";

const { meta, getThemedStory } = getThemedStoryFactory({
    sectionName,
    "wrappedComponent": { Typography }
});

export default meta;

export const Vue1 = getThemedStory({
    ...defaultProps,
    "children": "Foo bar"
});

