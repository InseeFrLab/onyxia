import { MyServicesRestorableConfig } from "ui/pages/myServices/MyServicesRestorableConfigs/MyServicesRestorableConfig";
import { sectionName } from "./sectionName";
import { getStoryFactory, logCallbacks, css } from "stories/getStory";
import rstudioImgUrl from "stories/assets/img/rstudio.png";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { MyServicesRestorableConfig }
});

export default meta;

const link = { "href": "https://example.com", "onClick": () => {} };

export const ViewShortVariant = getStory({
    "className": css({ "width": 400 }),
    "isShortVariant": true,
    "chartIconUrl": rstudioImgUrl,
    "friendlyName": "My RStudio a bit long",
    "launchLink": link,
    "editLink": link,
    ...logCallbacks(["onRequestDelete"])
});

export const ViewLongVariant = getStory({
    "className": css({ "width": 1000 }),
    "isShortVariant": false,
    "chartIconUrl": rstudioImgUrl,
    "friendlyName": "My RStudio a bit long",
    "launchLink": link,
    "editLink": link,
    ...logCallbacks(["onRequestDelete"])
});

export const ViewNoLogo = getStory({
    "className": css({ "width": 1000 }),
    "chartIconUrl": undefined,
    "isShortVariant": false,
    "friendlyName": "My RStudio a bit long",
    "launchLink": link,
    "editLink": link,
    ...logCallbacks(["onRequestDelete"])
});
