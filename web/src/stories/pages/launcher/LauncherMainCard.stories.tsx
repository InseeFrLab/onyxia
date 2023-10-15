import { LauncherMainCard } from "ui/pages/launcher/LauncherMainCard";
import { sectionName } from "./sectionName";
import { getStoryFactory, logCallbacks } from "stories/getStory";
import rstudioImg from "stories/assets/img/rstudio.png";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { LauncherMainCard },
    "defaultContainerWidth": 900
});

export default meta;

export const ViewDefault = getStory({
    "packageName": "rstudio",
    "packageIconUrl": rstudioImg,
    "isBookmarked": true,
    "friendlyName": "rstudio-1615211422",
    "isLaunchable": true,
    "isShared": false,
    ...logCallbacks([
        "onFriendlyNameChange",
        "onIsBookmarkedValueChange",
        "onRequestCancel",
        "onRequestCopyLaunchUrl",
        "onRequestLaunch",
        "onIsSharedValueChange",
        "onRequestRestoreAllDefault"
    ])
});
