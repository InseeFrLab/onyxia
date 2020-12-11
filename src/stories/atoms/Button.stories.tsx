
import React from "react";
import { Button, defaultProps } from "app/atoms/Button";
import { sectionName } from "./sectionName";
import { getThemedStoryFactory } from "stories/utils/getThemedStory";
import { buildMeta } from "stories/utils/buildMeta";

import { Icon } from "app/atoms/Icon";

export default buildMeta({
    sectionName,
    "wrappedComponent": { Button }
});

const { getThemedStory } = getThemedStoryFactory(Button);

export const TextOnly = getThemedStory({
    ...defaultProps,
    "children": "Foo bar"
});

export const TextWithIcon = getThemedStory({
    ...defaultProps,
    "children": <><Icon type="home" /> Home</>
});
