import { MyServicesCard } from "ui/pages/MyServices/MyServicesCards/MyServicesCard/MyServicesCard";
import { sectionName } from "./sectionName";
import { getStoryFactory, logCallbacks } from "stories/getStory";
import rstudioImgUrl from "stories/assets/img/rstudio.png";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { MyServicesCard },
    "defaultContainerWidth": 400
});

export default meta;

export const ViewRegular = getStory({
    "packageIconUrl": rstudioImgUrl,
    "friendlyName": "My Rstudio",
    "packageName": "rstudio",
    "openUrl": "https://example.com",
    "monitoringUrl": "https://example.com",
    "startTime": Date.now(),
    "isShared": true,
    "isOwned": false,
    "ownerUsername": "jdoe",
    "s3TokenExpirationTime": Date.now() + 3600 * 1000,
    "vaultTokenExpirationTime": Infinity,
    ...logCallbacks([
        "onRequestDelete",
        "onRequestShowPostInstallInstructions",
        "onRequestShowEnv"
    ])
});

export const ViewStarting = getStory({
    "packageIconUrl": rstudioImgUrl,
    "friendlyName": "My Rstudio",
    "packageName": "rstudio",
    "openUrl": "https://example.com",
    "monitoringUrl": "https://example.com",
    "startTime": undefined,
    "isShared": true,
    "isOwned": true,
    "ownerUsername": undefined,
    "s3TokenExpirationTime": Infinity,
    "vaultTokenExpirationTime": Infinity,
    ...logCallbacks([
        "onRequestDelete",
        "onRequestShowPostInstallInstructions",
        "onRequestShowEnv"
    ])
});
