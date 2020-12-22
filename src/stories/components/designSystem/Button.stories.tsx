
import React from "react";
import { Button, defaultProps } from "app/components/designSystem/Button";
import { sectionName } from "./sectionName";
import { getStoryFactory, logCallbacks } from "stories/geStory";
import { Icon } from "app/components/designSystem/Icon";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { Button }
});

export default meta;


export const TextOnly = getStory({
    ...defaultProps,
    "children": "Foo bar",
    "onClick": console.log.bind(null,"click!")
});

export const TextWithIcon = getStory({
    ...defaultProps,
    "children": <><Icon type="home" /> Home</>,
    ...logCallbacks(["onClick"])
});
