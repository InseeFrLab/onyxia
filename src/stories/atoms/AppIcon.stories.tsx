
import { AppIcon, defaultProps } from "app/atoms/AppIcon";
import { sectionName } from "./sectionName";
import { getThemedStoryFactory } from "stories/utils/getThemedStory";
import { buildMeta } from "stories/utils/buildMeta";

export default buildMeta({
    sectionName,
    "wrappedComponent": { AppIcon }
});

const { getThemedStory } = getThemedStoryFactory(AppIcon);

export const Home = getThemedStory({ ...defaultProps, "type": "home" });
