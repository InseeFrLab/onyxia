import { ExplorerItem } from "ui/pages/myFiles/Explorer/ExplorerItems/ExplorerItem";
import { sectionName } from "./sectionName";
import { getStoryFactory, logCallbacks } from "stories/getStory";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { ExplorerItem }
});

export default {
    ...meta
};

export const defaultView = getStory({
    "kind": "file",
    "basename": "aVeryLongNameThatShouldBreak.txt",
    "isSelected": false,
    "isCircularProgressShown": false,
    "getIsValidBasename": () => true,
    ...logCallbacks(["onMouseEvent", "onEditBasename", "onIsInEditingStateValueChange"])
});
