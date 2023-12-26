import { MyServicesCard } from "ui/pages/myServices/MyServicesCards/MyServicesCard/MyServicesCard";
import { sectionName } from "./sectionName";
import { getStoryFactory, logCallbacks } from "stories/getStory";
import rstudioImgUrl from "stories/assets/img/rstudio.png";
import { Evt } from "evt";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { MyServicesCard },
    "defaultContainerWidth": 400
});

export default meta;

export const ViewRegular = getStory({
    "chartIconUrl": rstudioImgUrl,
    "friendlyName": "My Rstudio",
    "chartName": "rstudio",
    "openUrl": "https://example.com",
    "monitoringUrl": "https://example.com",
    "startTime": Date.now(),
    "isShared": true,
    "isOwned": false,
    "ownerUsername": "jdoe",
    "evtAction": new Evt(),
    "getEnv": () => ({
        "foo": "foo value",
        "bar": "bar value",
        "baz": "baz value"
    }),
    "getPoseInstallInstructions": () => "Post **install** instructions",
    "projectServicePassword": "xyz",
    ...logCallbacks(["onRequestDelete"])
});

export const ViewStarting = getStory({
    "chartIconUrl": rstudioImgUrl,
    "friendlyName": "My Rstudio",
    "chartName": "rstudio",
    "openUrl": "https://example.com",
    "monitoringUrl": "https://example.com",
    "startTime": undefined,
    "isShared": true,
    "isOwned": true,
    "ownerUsername": undefined,
    "evtAction": new Evt(),
    "getEnv": () => ({
        "foo": "foo value",
        "bar": "bar value",
        "baz": "baz value"
    }),
    "getPoseInstallInstructions": () => "Post **install** instructions",
    "projectServicePassword": "xyz",
    ...logCallbacks(["onRequestDelete"])
});
