

import { MyServicesSavedConfig } from "app/components/pages/MyServices/MyServicesSavedConfig/MyServicesSavedConfig";
import { sectionName } from "./sectionName";
import { getStoryFactory, logCallbacks } from "stories/geStory";
import rstudioImgUrl from "stories/assets/img/rstudio.png";
import { css } from "tss-react";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { MyServicesSavedConfig }
});

export default meta;

export const VueShortVariant = getStory({
    "className": css({ "width": 400 }),
    "isShortVariant": true,
    "logoUrl": rstudioImgUrl,
    "friendlyName": "My RStudio a bit long",
    ...logCallbacks([ "callback"])
});

export const VueLongVariant = getStory({
    "className": css({ "width": 1000 }),
    "isShortVariant": false,
    "logoUrl": rstudioImgUrl,
    "friendlyName": "My RStudio a bit long",
    ...logCallbacks([ "callback"])
});

export const VueNoLogo = getStory({
    "className": css({ "width": 1000 }),
    "isShortVariant": false,
    "friendlyName": "My RStudio a bit long",
    ...logCallbacks([ "callback"])
});



