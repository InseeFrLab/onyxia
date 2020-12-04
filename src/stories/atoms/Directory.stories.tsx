
import { Directory } from "app/atoms/Directory";
import { sectionName } from "./sectionName";
import { getThemedStoryFactory } from "stories/utils/getThemedStory";
import { buildMeta } from "stories/utils/buildMeta";

export default buildMeta({
    sectionName,
    "wrappedComponent": { Directory }
});

const { getThemedStory } = getThemedStoryFactory(Directory);

export const Onyxia = getThemedStory({ 
    "basename": ".onyxia",
    "onClick": ()=> console.log("clicked!")
});
