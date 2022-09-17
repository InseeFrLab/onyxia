import { MyServicesSavedConfig } from "ui/components/pages/MyServices/MyServicesSavedConfigs/MyServicesSavedConfig";
import { sectionName } from "./sectionName";
import { getStoryFactory, logCallbacks } from "stories/getStory";
import rstudioImgUrl from "stories/assets/img/rstudio.png";
import { css } from "@emotion/css";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { MyServicesSavedConfig },
});

export default meta;

const link = { "href": "https://example.com", "onClick": () => {} };

export const VueShortVariant = getStory({
    "className": css({ "width": 400 }),
    "isShortVariant": true,
    "logoUrl": rstudioImgUrl,
    "friendlyName": "My RStudio a bit long",
    "launchLink": link,
    "editLink": link,
    ...logCallbacks(["callback"]),
});

export const VueLongVariant = getStory({
    "className": css({ "width": 1000 }),
    "isShortVariant": false,
    "logoUrl": rstudioImgUrl,
    "friendlyName": "My RStudio a bit long",
    "launchLink": link,
    "editLink": link,
    ...logCallbacks(["callback"]),
});

export const VueNoLogo = getStory({
    "className": css({ "width": 1000 }),
    "logoUrl": undefined,
    "isShortVariant": false,
    "friendlyName": "My RStudio a bit long",
    "launchLink": link,
    "editLink": link,
    ...logCallbacks(["callback"]),
});
