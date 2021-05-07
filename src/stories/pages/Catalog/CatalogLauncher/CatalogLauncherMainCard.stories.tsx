


import { CatalogLauncherMainCard } from "app/components/pages/Catalog/CatalogLauncher/CatalogLauncherMainCard";
import { sectionName } from "./sectionName";
import { getStoryFactory, logCallbacks } from "stories/geStory";
import rstudioImg from "stories/assets/img/rstudio.png";
import { css } from "tss-react";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { CatalogLauncherMainCard }
});

export default meta;

export const VueDefault = getStory({
    "className": css({ "width": 700 }),
    "serviceTitle": "RStudio",
    "serviceImageUrl":rstudioImg,
    "isBookmarked": true,
    "friendlyName": "rstudio-1615211422",
    "getIsValidFriendlyName": value=> value.includes(" ") ? 
        { "isValidValue": false, "message": "Can't contain spaces" } :
        { "isValidValue": true },
    "isLocked": false,
    ...logCallbacks(["onIsBookmarkedValueChange", "onFriendlyNameChange", "onFriendlyNameChange", "onRequestLaunch", "onRequestCancel"])
});
