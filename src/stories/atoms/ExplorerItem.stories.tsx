
import { ExplorerItem } from "app/atoms/ExplorerItem";
import { sectionName } from "./sectionName";
import { getThemedStoryFactory } from "stories/utils/getThemedStory";
import { buildMeta } from "stories/utils/buildMeta";

export default buildMeta({
    sectionName,
    "wrappedComponent": { ExplorerItem }
});

const { getThemedStory } = getThemedStoryFactory(ExplorerItem);

export const Directory = getThemedStory({ 
    "kind": "directory",
    "basename": ".onyxia",
    "onClick": ()=> console.log("directory clicked")
});

export const Secret = getThemedStory({ 
    "kind": "secret",
    "basename": "my-project",
    "onClick": ()=> console.log("project clicked")
});
