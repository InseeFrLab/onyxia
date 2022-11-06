import { MyServicesSavedConfigOptions } from "ui/components/pages/MyServices/MyServicesSavedConfigs/MyServicesSavedConfig/MyServicesSavedConfigOptions";
import { sectionName } from "./sectionName";
import { getStoryFactory, logCallbacks } from "stories/getStory";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { MyServicesSavedConfigOptions },
});

export default meta;

export const ViewDefault = getStory({
    ...logCallbacks(["callback"]),
});
