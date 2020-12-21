
import { ExplorerButtonBar } from "app/components/Explorer/ExplorerButtonBar";
import { sectionName } from "./sectionName";
import { getStoryFactory } from "stories/geStory";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { ExplorerButtonBar }
});

export default meta;

export const defaultView = getStory({
    "isThereAnItemSelected": false,
    "wordForFile": "file",
    "callback": console.log.bind(null, "callback")
});
