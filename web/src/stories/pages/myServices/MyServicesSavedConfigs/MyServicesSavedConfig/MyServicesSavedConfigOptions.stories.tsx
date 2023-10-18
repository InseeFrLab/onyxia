import { MyServicesSavedConfigOptions } from "ui/pages/myServices/MyServicesSavedConfigs/MyServicesRestorableConfig/MyServicesSavedConfigOptions";
import { sectionName } from "./sectionName";
import { getStoryFactory, logCallbacks } from "stories/getStory";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { MyServicesSavedConfigOptions }
});

export default meta;

export const ViewDefault = getStory({
    ...logCallbacks(["callback"])
});
