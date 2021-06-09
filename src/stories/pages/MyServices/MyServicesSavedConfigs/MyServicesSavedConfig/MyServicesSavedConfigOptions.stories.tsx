
import { MyServicesSavedConfigOptions } from "app/components/pages/MyServices/MyServicesSavedConfigs/MyServicesSavedConfig/MyServicesSavedConfigOptions";
import { sectionName } from "./sectionName";
import { getStoryFactory, logCallbacks } from "stories/geStory";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { MyServicesSavedConfigOptions }
});

export default meta;

export const VueDefault = getStory({
    ...logCallbacks([ "callback"])
});


