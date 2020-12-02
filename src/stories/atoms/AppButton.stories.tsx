
import React from "react";
import { AppButton } from "app/atoms/AppButton";
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
    "children": "Foo bar",
    "disabled": false,
    "color": "primary"
});

export const TextWithIcon = getThemedStory({
    "children": <><AppIcon type="home" /> Home</>
});
