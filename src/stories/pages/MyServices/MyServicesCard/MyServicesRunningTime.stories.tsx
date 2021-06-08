


import { MyServicesRunningTime } from "app/components/pages/MyServices/MyServicesCard/MyServicesRunningTime";
import { sectionName } from "./sectionName";
import { getStoryFactory } from "stories/geStory";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { MyServicesRunningTime }
});

export default meta;

export const VueRegular = getStory({
    "isOvertime": false,
    "startTime": Date.now()
});

export const VueOvertime = getStory({
    "isOvertime": true,
    "startTime": Date.now() - 3600 * 1000 * 25
});
