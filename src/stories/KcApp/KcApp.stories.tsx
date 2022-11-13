import KcApp from "ui/components/KcApp";
import { sectionName } from "./sectionName";
import { getStoryFactory } from "stories/getStory";
import { kcContextLogin, kcContextRegister } from "./kcContexts";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { KcApp }
});

export default meta;

export const Login = getStory({
    "kcContext": kcContextLogin
});

export const Register = getStory({
    "kcContext": kcContextRegister
});
