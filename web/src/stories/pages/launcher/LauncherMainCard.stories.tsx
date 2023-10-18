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
    "chartName": "rstudio",
    "chartIconUrl": rstudioImg,
    "isBookmarked": true,
    "myServicesSavedConfigsExtendedLink": {
        "href": "https://example.com",
        "onClick": () => {}
    },
    "friendlyName": "rstudio-1615211422",
    "isLaunchable": true,
    "isShared": false,
    ...logCallbacks([
        "onFriendlyNameChange",
        "onRequestToggleBookmark",
        "onRequestCancel",
        "onRequestCopyLaunchUrl",
        "onRequestLaunch",
        "onIsSharedValueChange",
        "onRequestRestoreAllDefault"
    ])
});
