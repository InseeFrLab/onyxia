
import { ServiceBadge } from "app/components/designSystem/ServiceBadge";
import { sectionName } from "./sectionName";
import { getStoryFactory } from "stories/geStory";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { ServiceBadge }
});

export default meta;

export const Elk = getStory({ "type": "elk" });
