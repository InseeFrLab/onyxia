import { Template } from "app/components/KcApp/Template";
import { sectionName } from "./sectionName";
import { getStoryFactory } from "stories/getStory";
import { defaultKcProps } from "keycloakify";
import { kcContextLogin } from "./kcContexts";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { Template },
});

export default meta;

export const Vue1 = getStory({
    "doFetchDefaultThemeResources": false,
    "kcContext": kcContextLogin,
    "displayInfo": true,
    "displayWide": true,
    "headerNode": <p>Header node</p>,
    "formNode": <p>Form node</p>,
    "infoNode": <p>Info node</p>,
    ...defaultKcProps,
});
