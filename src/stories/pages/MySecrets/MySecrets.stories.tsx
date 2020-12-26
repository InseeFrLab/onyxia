

import { MySecrets } from "app/pages/MySecrets";
import { getStoryFactory } from "stories/geStory";
import { sectionName } from "./sectionName";

const { meta, getStory: getThemedStory } = getStoryFactory({
    sectionName,
    "doProvideMockStore": true,
    "wrappedComponent": { MySecrets }
});

export default meta;

export const Vue1 = getThemedStory({});

