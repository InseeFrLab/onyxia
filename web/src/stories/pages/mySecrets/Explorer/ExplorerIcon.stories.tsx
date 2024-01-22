import { ExplorerIcon } from "ui/pages/myFiles/Explorer/ExplorerIcon";
import { sectionName } from "./sectionName";
import { getStoryFactory, css } from "stories/getStory";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { ExplorerIcon }
});

export default meta;

export const view = getStory({
    "iconId": "data",
    "hasShadow": true,
    "className": css({ "height": 200 })
});
