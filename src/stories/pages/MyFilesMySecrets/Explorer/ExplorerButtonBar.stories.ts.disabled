import { ExplorerButtonBar } from "ui/components/shared/Explorer/ExplorerButtonBar";
import { sectionName } from "./sectionName";
import { getStoryFactory, logCallbacks } from "stories/getStory";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { ExplorerButtonBar },
});

export default meta;

export const defaultView = getStory({
    "selectedItemKind": "none",
    "isViewingFile": false,
    "isSelectedItemInEditingState": false,
    "wordForFile": "file",
    ...logCallbacks(["callback"]),
});
