import { AgentConnectButton } from "ui/KcApp/Login/AgentConnectButton";
import { sectionName } from "./sectionName";
import { getStoryFactory } from "stories/getStory";
//import { css } from "tss-react/compat";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { AgentConnectButton }
});

export default meta;

export const Login = getStory({
    "url": "#"
});
