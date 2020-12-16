
import { Icon, defaultProps } from "app/components/designSystem/Icon";
import { sectionName } from "./sectionName";
import { getThemedStoryFactory } from "stories/utils/getThemedStory";

const { meta, getThemedStory} = getThemedStoryFactory({
    sectionName,
    "wrappedComponent": { Icon }
});

export default meta;

export const Home = getThemedStory({ ...defaultProps, "type": "home" });
