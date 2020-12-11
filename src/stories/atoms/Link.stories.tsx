



import { Link } from "app/atoms/Link";
import { sectionName } from "./sectionName";
import { getThemedStoryFactory } from "stories/utils/getThemedStory";
import { buildMeta } from "stories/utils/buildMeta";

export default buildMeta({
    sectionName,
    "wrappedComponent": { Link }
});

const { getThemedStory } = getThemedStoryFactory(Link);

export const Home = getThemedStory({ "children": "I am a link", "href": "#" });
