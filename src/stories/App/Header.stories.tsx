

import { Header } from "app/components/App/Header";
import { getStoryFactory, logCallbacks } from "stories/geStory";
import { sectionName } from "./sectionName";
import { css } from "app/theme/useClassNames";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { Header }
});

export default meta;

export const Vue1 = getStory({
    "className": css({ "width": 1000, "height": 64 }),
    "isUserLoggedIn": false,
    "logoWidthInPercent": 4,
    "paddingRightInPercent": 2,
    ...logCallbacks(["onClick"])
});

