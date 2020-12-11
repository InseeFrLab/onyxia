
import { Icon, defaultProps } from "app/atoms/Icon";
import { sectionName } from "./sectionName";
import { getThemedStoryFactory } from "stories/utils/getThemedStory";
import { buildMeta } from "stories/utils/buildMeta";

export default buildMeta({
    sectionName,
    "wrappedComponent": { Icon }
});

const { getThemedStory } = getThemedStoryFactory(Icon);

export const Home = getThemedStory({ ...defaultProps, "type": "home" });
