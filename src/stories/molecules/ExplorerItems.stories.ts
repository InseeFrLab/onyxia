

import { ExplorerItems } from "app/molecules/ExplorerItems";
import { sectionName } from "./sectionName";
import { getThemedStoryFactory } from "stories/utils/getThemedStory";
import { buildMeta } from "stories/utils/buildMeta";

export default buildMeta({
    sectionName,
    "wrappedComponent": { ExplorerItems }
});

const { getThemedStory } = getThemedStoryFactory(ExplorerItems);

export const Vue1 = getThemedStory({ 
    "visualRepresentationOfAFile": "secret",
    "directories": [ "dir1", "dir2", "dir3" ],
    "files": [ "file1", "file2", "file3" ],
    "onOpen": console.log
});
