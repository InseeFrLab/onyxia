import { AgentConnectButton } from "app/components/KcApp/Login/AgentConnectButton";
import { sectionName } from "./sectionName";
import { getStoryFactory } from "stories/geStory";
//import { css } from "tss-react";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { AgentConnectButton },
});

export default meta;

export const Login = getStory({
    "url": "#",
});
