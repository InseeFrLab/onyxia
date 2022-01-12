import { MyServicesRoundLogo } from "ui/components/pages/MyServices/MyServicesCards/MyServicesCard/MyServicesRoundLogo";
import { sectionName } from "./sectionName";
import { getStoryFactory } from "stories/getStory";
import rstudioLogoUrl from "stories/assets/img/rstudio.png";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { MyServicesRoundLogo },
});

export default meta;

export const VueSuccess = getStory({
    "url": rstudioLogoUrl,
    "severity": "success",
});

export const VueWarning = getStory({
    "url": rstudioLogoUrl,
    "severity": "warning",
});

export const VueError = getStory({
    "url": rstudioLogoUrl,
    "severity": "error",
});

export const VuePending = getStory({
    "url": rstudioLogoUrl,
    "severity": "pending",
});
