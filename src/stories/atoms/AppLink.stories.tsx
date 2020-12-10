



import { AppLink } from "app/atoms/AppLink";
import { sectionName } from "./sectionName";
import { getThemedStoryFactory } from "stories/utils/getThemedStory";
import { buildMeta } from "stories/utils/buildMeta";

export default buildMeta({
    sectionName,
    "wrappedComponent": { AppLink }
});

const { getThemedStory } = getThemedStoryFactory(AppLink);

export const Home = getThemedStory({ "children": "I am a link", "href": "#" });
