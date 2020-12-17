
import { ExplorerItem } from "app/components/Explorer/ExplorerItem";
import { sectionName } from "./sectionName";
import { getStoryFactory } from "stories/geStory";
import { pure } from "lib/useCases/secretExplorer";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { ExplorerItem }
});

export default meta;

export const Vue1 = getStory({
    "visualRepresentationOfAFile": "secret",
    "kind": "file",
    "basename": "my-project-envs",
    "isSelected": false,
    "standardizedWidth": "big",
    "isBeingEdited": false,
    "isCircularProgressShown": false,
    "onMouseEvent": console.log.bind(null,"onMouseEvent"),
    "onEditedBasename": console.log.bind(null,"onEditedBasename"),
    "getIsValidBasename": pure.getIsValidBasename
});

