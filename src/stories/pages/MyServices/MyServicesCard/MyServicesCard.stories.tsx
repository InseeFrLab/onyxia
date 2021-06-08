

import { MyServicesCard } from "app/components/pages/MyServices/MyServicesCard/MyServicesCard";
import { sectionName } from "./sectionName";
import { getStoryFactory, logCallbacks } from "stories/geStory";
import rstudioImgUrl from "stories/assets/img/rstudio.png";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { MyServicesCard }
});

export default meta;

export const VueRegular = getStory({
    "packageIconUrl": rstudioImgUrl,
    "friendlyName": "My Rstudio",
    "packageName": "rstudio",
    "infoHref": "https://example.com",
    "openHref": "https://example.com",
    "monitorHref": "https://example.com",
    //Undefined when the service is not yey launched
    "startTime": Date.now(),
    "isOvertime": false,
    ...logCallbacks(["onRequestDelete"])
});

