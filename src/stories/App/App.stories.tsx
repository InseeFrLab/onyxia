


import { App } from "app/components/App";
import { getStoryFactory } from "stories/geStory";
import { sectionName } from "./sectionName";
import { css } from "tss-react";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { App },
    "doProvideMockStore": true
});

export default meta;


export const Vue1 = getStory({
    "className": css({ "width": 1600 })
});

