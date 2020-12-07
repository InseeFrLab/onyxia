
import { ExplorerItem } from "app/atoms/ExplorerItem";
import { sectionName } from "./sectionName";
import { getThemedStoryFactory } from "stories/utils/getThemedStory";
import { buildMeta } from "stories/utils/buildMeta";

export default buildMeta({
    sectionName,
    "wrappedComponent": { ExplorerItem }
});

const { getThemedStory } = getThemedStoryFactory(ExplorerItem);

export const Vue1 = getThemedStory({ 
    "visualRepresentationOfAFile": "secret",
    "kind": "file",
    "basename": "my-project-envs",
    "isSelected": false,
    "isBeingEdited": false,
    "onBasenameChanged": console.log,
    "onMouseEvent": console.log,
    "isRenameRequestBeingProcessed": false,
    "standardizedWidth": "big"
});

