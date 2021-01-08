
import { getStoryFactory } from "stories/geStory";
import { sectionName } from "./sectionName";
import { CommandTranslation } from "app/components/CommandTranslation";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { CommandTranslation }
});

export default meta;

export const Vue1 = getStory({ });





