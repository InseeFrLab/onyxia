
import { Link } from "app/components/designSystem/Link";
import { sectionName } from "./sectionName";
import { getStoryFactory } from "stories/geStory";

const { meta, getThemedStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { Link }
});

export default meta;

export const Home = getThemedStory({ "children": "I am a link", "href": "#" });
