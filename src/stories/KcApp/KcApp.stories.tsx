import { KcApp } from "app/components/KcApp";
import { sectionName } from "./sectionName";
import { getStoryFactory } from "stories/geStory";
import { kcContextLogin, kcContextRegister } from "./kcContexts";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { KcApp },
});

export default meta;

export const Login = getStory({
    "kcContext": kcContextLogin,
});

export const Register = getStory({
    "kcContext": kcContextRegister,
});
