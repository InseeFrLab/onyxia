
import { ExplorerItem } from "app/components/Explorer/ExplorerItem";
import { sectionName } from "./sectionName";
import { getStoryFactory } from "stories/geStory";

const { meta, getThemedStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { ExplorerItem }
});

export default meta;

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

