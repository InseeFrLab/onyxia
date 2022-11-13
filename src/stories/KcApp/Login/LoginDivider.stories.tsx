import { LoginDivider } from "ui/components/KcApp/Login/LoginDivider";
import { sectionName } from "./sectionName";
import { getStoryFactory } from "stories/getStory";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { LoginDivider }
});

export default meta;

export const Login = getStory({});
