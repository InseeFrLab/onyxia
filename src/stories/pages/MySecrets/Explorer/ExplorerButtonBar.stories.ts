import { ExplorerButtonBar } from "ui/components/pages/MyFiles/Explorer/ExplorerButtonBar";
import { sectionName } from "./sectionName";
import { getStoryFactory, logCallbacks } from "stories/getStory";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { ExplorerButtonBar }
});

export default meta;

export const View = getStory({
    "selectedItemKind": "none",
    ...logCallbacks(["callback"])
});
