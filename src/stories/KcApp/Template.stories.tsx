
import { Template } from "app/components/KcApp/Template";
import { sectionName } from "./sectionName";
import { getStoryFactory } from "stories/geStory";
import { kcContextMocks, defaultKcProps } from "keycloakify";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { Template }
});

export default meta;

export const Vue1 = getStory({
    "doFetchDefaultThemeResources": false,
    "kcContext": kcContextMocks.kcLoginContext,
    "displayInfo": true,
    "displayWide": true,
    "headerNode": <p>Header node</p>,
    "formNode": <p>Form node</p>,
    "infoNode": <p>Info node</p>,
    ...defaultKcProps
});


