
import { MySecretsHeader } from "app/pages/MySecrets/MySecretsHeader";
import { getStoryFactory } from "stories/geStory";
import { sectionName } from "./sectionName";


const { meta, getThemedStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { MySecretsHeader }
});

export default meta;

export const Vue1 = getThemedStory({});

