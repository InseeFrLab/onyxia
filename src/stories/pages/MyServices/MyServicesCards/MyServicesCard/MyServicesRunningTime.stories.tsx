import { MyServicesRunningTime } from "ui/components/pages/MyServices/MyServicesCards/MyServicesCard/MyServicesRunningTime";
import { sectionName } from "./sectionName";
import { getStoryFactory } from "stories/getStory";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { MyServicesRunningTime },
});

export default meta;

export const ViewRegular = getStory({
    "isRunning": true,
    "doesHaveBeenRunningForTooLong": false,
    "startTime": Date.now(),
});

export const ViewOvertime = getStory({
    "isRunning": true,
    "doesHaveBeenRunningForTooLong": true,
    "startTime": Date.now() - 3600 * 1000 * 25,
});

export const ViewNotYetLaunched = getStory({
    "isRunning": false,
});
