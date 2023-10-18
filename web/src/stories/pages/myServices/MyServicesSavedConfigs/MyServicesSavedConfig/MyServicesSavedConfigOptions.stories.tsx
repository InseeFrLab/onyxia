import { MyServicesRestorableConfigOptions } from "ui/pages/myServices/MyServicesRestorableConfigs/MyServicesRestorableConfig/MyServicesRestorableConfigOptions";
import { sectionName } from "./sectionName";
import { getStoryFactory, logCallbacks } from "stories/getStory";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { MyServicesRestorableConfigOptions }
});

export default meta;

export const ViewDefault = getStory({
    ...logCallbacks(["callback"])
});
