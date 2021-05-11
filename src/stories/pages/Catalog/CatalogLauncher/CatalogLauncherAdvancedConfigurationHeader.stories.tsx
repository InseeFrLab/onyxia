
import { CatalogLauncherAdvancedConfigurationHeader } from "app/components/pages/Catalog/CatalogLauncher/CatalogLauncherAdvancedConfigurationHeader";
import { sectionName } from "./sectionName";
import { getStoryFactory, logCallbacks } from "stories/geStory";
import { css } from "tss-react";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { CatalogLauncherAdvancedConfigurationHeader }
});

export default meta;

export const VueDefault = getStory({
    "className": css({ "width": 700 }),
    "state": "collapsed",
    ...logCallbacks(["onStateChange"])
});
