import { CatalogLauncherMainCard } from "ui/components/pages/Catalog/CatalogLauncher/CatalogLauncherMainCard";
import { sectionName } from "./sectionName";
import { getStoryFactory, logCallbacks } from "stories/getStory";
import rstudioImg from "stories/assets/img/rstudio.png";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { CatalogLauncherMainCard },
    "defaultContainerWidth": 900
});

export default meta;

export const ViewDefault = getStory({
    "packageName": "rstudio",
    "packageIconUrl": rstudioImg,
    "version": "1.0.0",
    "availableVersions": ["1.0.0", "0.1.1", "0.1.0", "0.0.1"],
    "isBookmarked": true,
    "friendlyName": "rstudio-1615211422",
    "isLaunchable": true,
    "isShared": false,
    ...logCallbacks([
        "onVersionValueChange",
        "onFriendlyNameChange",
        "onIsBookmarkedValueChange",
        "onRequestCancel",
        "onRequestCopyLaunchUrl",
        "onRequestLaunch",
        "onIsSharedValueChange"
    ])
});
