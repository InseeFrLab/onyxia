import { ExplorerIcon } from "ui/components/pages/MyFiles/Explorer/ExplorerIcon";
import { sectionName } from "./sectionName";
import { getStoryFactory } from "stories/getStory";
import { css } from "@emotion/css";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { ExplorerIcon },
});

export default meta;

export const view = getStory({
    "iconId": "data",
    "hasShadow": true,
    "className": css({ "height": 200 }),
});
