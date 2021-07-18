import { LoginDivider } from "app/components/KcApp/Login/LoginDivider";
import { sectionName } from "./sectionName";
import { getStoryFactory } from "stories/geStory";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { LoginDivider },
});

export default meta;

export const Login = getStory({});
