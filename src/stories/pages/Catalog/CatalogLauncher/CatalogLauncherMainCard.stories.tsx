import { CatalogLauncherMainCard } from "app/components/pages/Catalog/CatalogLauncher/CatalogLauncherMainCard";
import { sectionName } from "./sectionName";
import { getStoryFactory, logCallbacks } from "stories/geStory";
import rstudioImg from "stories/assets/img/rstudio.png";
import { css } from "tss-react";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { CatalogLauncherMainCard },
});

export default meta;

export const VueDefault = getStory({
    "className": css({ "width": 700 }),
    "packageName": "rstudio",
    "packageIconUrl": rstudioImg,
    "isBookmarked": true,
    "friendlyName": "rstudio-1615211422",
    "isLaunchable": true,
    ...logCallbacks([
        "onFriendlyNameChange",
        "onIsBookmarkedValueChange",
        "onRequestCancel",
        "onRequestCopyLaunchUrl",
        "onRequestLaunch",
    ]),
});
