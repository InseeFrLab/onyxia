
import { ServiceBadge } from "app/atoms/ServiceBadge";
import { sectionName } from "./sectionName";
import { getThemedStoryFactory } from "stories/utils/getThemedStory";
import { buildMeta } from "stories/utils/buildMeta";

export default buildMeta({
    sectionName,
    "wrappedComponent": { ServiceBadge }
});

const { getThemedStory } = getThemedStoryFactory(ServiceBadge);

export const Elk = getThemedStory({ "type": "elk" });
