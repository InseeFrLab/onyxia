import { AgentConnectButton } from "ui/keycloak-theme/Login/AgentConnectButton";
import { sectionName } from "./sectionName";
import { getStoryFactory } from "stories/getStory";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { AgentConnectButton }
});

export default meta;

export const Login = getStory({
    "url": "#"
});
