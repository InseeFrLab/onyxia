
import { ExplorerItem } from "app/atoms/ExplorerItem";
import { sectionName } from "./sectionName";
import { getThemedStoryFactory } from "stories/utils/getThemedStory";
import { buildMeta } from "stories/utils/buildMeta";

export default buildMeta({
    sectionName,
    "wrappedComponent": { ExplorerItem }
});

const { getThemedStory } = getThemedStoryFactory(ExplorerItem);

export const Directory = getThemedStory({ 
    "visualRepresentationOfAFile": "file",
    "kind": "directory",
    "basename": ".onyxia",
    "onClick": ()=> console.log("click")
});

export const Secret = getThemedStory({ 
    "visualRepresentationOfAFile": "secret",
    "kind": "file",
    "basename": "my-project-envs",
    "onClick": ()=> console.log("click")
});

export const File = getThemedStory({ 
    "visualRepresentationOfAFile": "file",
    "kind": "file",
    "basename": "my_file.csv",
    "onClick": ()=> console.log("click")
});
