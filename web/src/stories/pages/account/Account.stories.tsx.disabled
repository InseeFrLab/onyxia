import Account from "ui/pages/account/Account";
import { sectionName } from "./sectionName";
import { createMockRoute, getStoryFactory } from "stories/getStory";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { Account },
    "doNeedCore": true
});

export default meta;

export const VueDefault = getStory({
    "route": createMockRoute("account", {})
});
