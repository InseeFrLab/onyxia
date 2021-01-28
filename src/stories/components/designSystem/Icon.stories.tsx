
import { Icon, defaultProps } from "app/components/designSystem/Icon";
import { sectionName } from "./sectionName";
import { getStoryFactory } from "stories/geStory";

const { meta, getStory} = getStoryFactory({
    sectionName,
    "wrappedComponent": { Icon }
});

export default meta;

export const Home = getStory({ ...defaultProps, "type": "home" });
