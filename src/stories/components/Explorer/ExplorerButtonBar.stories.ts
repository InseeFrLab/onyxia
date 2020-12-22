
import { ExplorerButtonBar } from "app/components/Explorer/ExplorerButtonBar";
import { sectionName } from "./sectionName";
import { getStoryFactory, logCallbacks } from "stories/geStory";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { ExplorerButtonBar }
});

export default meta;

export const defaultView = getStory({
    "isThereAnItemSelected": false,
    "wordForFile": "file",
    ...logCallbacks(["callback"])
});
