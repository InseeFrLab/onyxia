
import { MySecretsEditorRow } from "app/pages/MySecrets/MySecretsEditor/MySecretsEditorRow";
import { getStoryFactory } from "stories/geStory";
import { sectionName } from "./sectionsName";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "doProvideMockStore": true,
    "wrappedComponent": { MySecretsEditorRow }
});

export default meta;

export const Vue1 = getStory({});

