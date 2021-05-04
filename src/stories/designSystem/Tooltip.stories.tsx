
import { Tooltip } from "app/components/designSystem/Tooltip";
import { Icon } from "app/components/designSystem/Icon";
import { sectionName } from "./sectionName";
import { getStoryFactory } from "stories/geStory";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { Tooltip }
});

export default meta;

export const Vue1 = getStory({
    "children": <Icon type="help" />,
    "title": "This is the title"
});


