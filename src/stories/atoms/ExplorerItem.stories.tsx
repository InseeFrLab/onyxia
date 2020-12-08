
import { ExplorerItem } from "app/atoms/ExplorerItem";
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
    "onEditedBasename": console.log.bind("onInputFocusout"),
    "onMouseEvent": console.log.bind("onMouseEvent"),
    "isRenameRequestBeingProcessed": false,
    "standardizedWidth": "big",
    "getIsValidBasename": ({ basename }) => basename.indexOf(" ") < 0
});

