
import { MySecretsHeader } from "app/pages/MySecrets/MySecretsHeader";
import { getThemedStoryFactory } from "stories/utils/getThemedStory";
import { sectionName } from "./sectionName";


const { meta, getThemedStory } = getThemedStoryFactory({
    sectionName,
    "wrappedComponent": { MySecretsHeader }
});

export default meta;

export const Vue1 = getThemedStory({});

