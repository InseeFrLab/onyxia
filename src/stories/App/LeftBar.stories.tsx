
import { LeftBar } from "app/components/App/LeftBar";
import { getStoryFactory, logCallbacks } from "stories/geStory";
import { sectionName } from "./sectionName";
import { css } from "jss-emotion";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { LeftBar }
});

export default meta;

export const Vue1 = getStory({
    "className": css({ "height": 700, "maxWidth": 400 }),
    "collapsedWidth": 72,
    "currentPage": "home",
    ...logCallbacks(["onClick"])
});

