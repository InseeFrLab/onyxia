
import { ExplorerItem } from "app/components/Explorer/ExplorerItem";
import { sectionName } from "../designSystem/sectionName";
import { getStoryFactory } from "stories/geStory";
import { pure } from "lib/setup";

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
    "standardizedWidth": "big",
    "isBeingEdited": false,
    "isCircularProgressShown": false,
    "onMouseEvent": console.log.bind("onMouseEvent"),
    "onEditedBasename": console.log.bind("onEditedBasename"),
    "getIsValidBasename": pure.secretExplorer.getIsValidBasename
});

