
import { ServiceBadge } from "app/components/designSystem/ServiceBadge";
import { sectionName } from "./sectionName";
import { getThemedStoryFactory } from "stories/utils/getThemedStory";

export const { meta, getThemedStory } = getThemedStoryFactory({
    sectionName,
    "wrappedComponent": { ServiceBadge }
});

export default meta;

export const Elk = getThemedStory({ "type": "elk" });
