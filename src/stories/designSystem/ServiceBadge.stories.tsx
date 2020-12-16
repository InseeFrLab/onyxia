
import { ServiceBadge } from "app/components/designSystem/ServiceBadge";
import { sectionName } from "./sectionName";
import { getStoryFactory } from "stories/geStory";

export const { meta, getStory: getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { ServiceBadge }
});

export default meta;

export const Elk = getStory({ "type": "elk" });
