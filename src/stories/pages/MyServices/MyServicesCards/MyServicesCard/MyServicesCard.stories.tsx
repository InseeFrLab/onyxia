import { MyServicesCard } from "app/components/pages/MyServices/MyServicesCards/MyServicesCard/MyServicesCard";
import { sectionName } from "./sectionName";
import { getStoryFactory, logCallbacks } from "stories/getStory";
import rstudioImgUrl from "stories/assets/img/rstudio.png";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { MyServicesCard },
});

export default meta;

export const VueRegular = getStory({
    "packageIconUrl": rstudioImgUrl,
    "friendlyName": "My Rstudio",
    "packageName": "rstudio",
    "infoUrl": "https://example.com",
    "openUrl": "https://example.com",
    "monitoringUrl": "https://example.com",
    "startTime": Date.now(),
    "isOvertime": false,
    ...logCallbacks(["onRequestDelete", "onRequestShowPostInstallInstructions"]),
});

export const VueStarting = getStory({
    "packageIconUrl": rstudioImgUrl,
    "friendlyName": "My Rstudio",
    "packageName": "rstudio",
    "infoUrl": "https://example.com",
    "openUrl": "https://example.com",
    "monitoringUrl": "https://example.com",
    "startTime": undefined,
    "isOvertime": false,
    ...logCallbacks(["onRequestDelete", "onRequestShowPostInstallInstructions"]),
});
