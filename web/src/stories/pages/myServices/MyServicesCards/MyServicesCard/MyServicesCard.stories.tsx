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
    "evtAction": new Evt(),
    "getEnv": () => ({
        "foo": "foo value",
        "bar": "bar value",
        "baz": "baz value"
    }),
    "getPoseInstallInstructions": () => "Post **install** instructions",
    "getProjectServicePassword": () => Promise.resolve("password"),
    ...logCallbacks(["onRequestDelete"])
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
    "evtAction": new Evt(),
    "getEnv": () => ({
        "foo": "foo value",
        "bar": "bar value",
        "baz": "baz value"
    }),
    "getPoseInstallInstructions": () => "Post **install** instructions",
    "getProjectServicePassword": () => Promise.resolve("password"),
    ...logCallbacks(["onRequestDelete"])
});
