
import { KcApp } from "app/components/KcApp";
import { sectionName } from "./sectionName";
import { getStoryFactory } from "stories/geStory";
import { kcContextMocks } from "keycloakify";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { KcApp }
});

export default meta;

export const Login = getStory({
    "kcContext": kcContextMocks.kcLoginContext
});

export const Register = getStory({
    "kcContext": kcContextMocks.kcRegisterContext
});

