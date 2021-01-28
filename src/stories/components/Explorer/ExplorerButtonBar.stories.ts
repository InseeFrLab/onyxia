
import { ExplorerButtonBar } from "app/components/Explorer/ExplorerButtonBar";
import { sectionName } from "./sectionName";
import { getStoryFactory, logCallbacks } from "stories/geStory";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { ExplorerButtonBar }
});

export default meta;

export const defaultView = getStory({
    "selectedItemKind": "none",
    "isViewingFile": false,
    "isSelectedItemInEditingState": false,
    "wordForFile": "file",
    "paddingLeftSpacing": 5,
    ...logCallbacks(["callback"])
});
