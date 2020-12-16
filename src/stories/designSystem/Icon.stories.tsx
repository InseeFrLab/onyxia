
import { Icon, defaultProps } from "app/components/designSystem/Icon";
import { sectionName } from "./sectionName";
import { getStoryFactory } from "stories/geStory";

const { meta, getThemedStory} = getStoryFactory({
    sectionName,
    "wrappedComponent": { Icon }
});

export default meta;

export const Home = getThemedStory({ ...defaultProps, "type": "home" });
