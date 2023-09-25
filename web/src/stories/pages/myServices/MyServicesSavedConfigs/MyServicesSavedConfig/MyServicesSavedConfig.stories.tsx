import { MyServicesSavedConfig } from "ui/pages/myServices/MyServicesSavedConfigs/MyServicesSavedConfig";
import { sectionName } from "./sectionName";
import { getStoryFactory, logCallbacks } from "stories/getStory";
import rstudioImgUrl from "stories/assets/img/rstudio.png";
import { css } from "@emotion/css";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { MyServicesSavedConfig }
});

export default meta;

const link = { "href": "https://example.com", "onClick": () => {} };

export const ViewShortVariant = getStory({
    "className": css({ "width": 400 }),
    "isShortVariant": true,
    "logoUrl": rstudioImgUrl,
    "friendlyName": "My RStudio a bit long",
    "launchLink": link,
    "editLink": link,
    ...logCallbacks(["callback"])
});

export const ViewLongVariant = getStory({
    "className": css({ "width": 1000 }),
    "isShortVariant": false,
    "logoUrl": rstudioImgUrl,
    "friendlyName": "My RStudio a bit long",
    "launchLink": link,
    "editLink": link,
    ...logCallbacks(["callback"])
});

export const ViewNoLogo = getStory({
    "className": css({ "width": 1000 }),
    "logoUrl": undefined,
    "isShortVariant": false,
    "friendlyName": "My RStudio a bit long",
    "launchLink": link,
    "editLink": link,
    ...logCallbacks(["callback"])
});
