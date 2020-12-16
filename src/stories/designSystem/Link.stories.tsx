
import { Link } from "app/components/designSystem/Link";
import { sectionName } from "./sectionName";
import { getThemedStoryFactory } from "stories/utils/getThemedStory";

const { meta, getThemedStory } = getThemedStoryFactory({
    sectionName,
    "wrappedComponent": { Link }
});

export default meta;

export const Home = getThemedStory({ "children": "I am a link", "href": "#" });
