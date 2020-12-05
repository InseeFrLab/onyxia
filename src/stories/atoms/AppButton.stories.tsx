
import React from "react";
import { AppButton, defaultProps } from "app/atoms/AppButton";
import { sectionName } from "./sectionName";
import { getThemedStoryFactory } from "stories/utils/getThemedStory";
import { buildMeta } from "stories/utils/buildMeta";

import { AppIcon } from "app/atoms/AppIcon";

export default buildMeta({
    sectionName,
    "wrappedComponent": { AppButton }
});

const { getThemedStory } = getThemedStoryFactory(AppButton);

export const TextOnly = getThemedStory({
    ...defaultProps,
    "children": "Foo bar"
});

export const TextWithIcon = getThemedStory({
    ...defaultProps,
    "children": <><AppIcon type="home" /> Home</>
});
