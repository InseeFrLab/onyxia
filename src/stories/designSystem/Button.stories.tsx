
import React from "react";
import { Button, defaultProps } from "app/components/designSystem/Button";
import { sectionName } from "./sectionName";
import { getThemedStoryFactory } from "stories/utils/getThemedStory";
import { Icon } from "app/components/designSystem/Icon";

const { meta, getThemedStory } = getThemedStoryFactory({
    sectionName,
    "wrappedComponent": { Button }
});

export default meta;


export const TextOnly = getThemedStory({
    ...defaultProps,
    "children": "Foo bar",
    "onClick": console.log.bind("click!")
});

export const TextWithIcon = getThemedStory({
    ...defaultProps,
    "children": <><Icon type="home" /> Home</>,
    "onClick": console.log.bind("click!")
});
