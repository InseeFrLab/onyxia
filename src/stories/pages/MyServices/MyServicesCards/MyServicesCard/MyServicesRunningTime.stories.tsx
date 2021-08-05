import { MyServicesRunningTime } from "app/components/pages/MyServices/MyServicesCards/MyServicesCard/MyServicesRunningTime";
import { sectionName } from "./sectionName";
import { getStoryFactory } from "stories/geStory";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { MyServicesRunningTime },
});

export default meta;

export const VueRegular = getStory({
    "isRunning": true,
    "isOvertime": false,
    "startTime": Date.now(),
});

export const VueOvertime = getStory({
    "isRunning": true,
    "isOvertime": true,
    "startTime": Date.now() - 3600 * 1000 * 25,
});

export const VueNotYetLaunched = getStory({
    "isRunning": false,
});
