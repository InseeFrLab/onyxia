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
    "isThereASavedConfigWithThisFriendlyName": false,
    "chartVersion": "1.2.3",
    "availableChartVersions": [
        "1.3.0-rc.0",
        "1.2.4",
        "1.2.3",
        "1.2.2",
        "1.2.1",
        "1.2.0",
        "1.1.0",
        "1.0.0"
    ],
    "catalogName": "Interactive services",
    "catalogRepositoryUrl":
        "https://inseefrlab.github.io/helm-charts-interactive-services",
    "myServicesSavedConfigsExtendedLink": {
        "href": "https://example.com",
        "onClick": () => {}
    },
    "friendlyName": "rstudio-1615211422",
    "isLaunchable": true,
    "isSharedWrap": undefined,
    ...logCallbacks([
        "onChartVersionChange",
        "onFriendlyNameChange",
        "onRequestToggleBookmark",
        "onRequestCancel",
        "onRequestCopyLaunchUrl",
        "onRequestLaunch",
        "onRequestRestoreAllDefault"
    ]),
    "s3ConfigsSelect": undefined
});
