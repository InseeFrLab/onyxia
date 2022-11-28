import { MyServicesRoundLogo } from "ui/components/pages/MyServices/MyServicesCards/MyServicesCard/MyServicesRoundLogo";
import { sectionName } from "./sectionName";
import { getStoryFactory } from "stories/getStory";
import rstudioLogoUrl from "stories/assets/img/rstudio.png";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { MyServicesRoundLogo }
});

export default meta;

export const ViewSuccess = getStory({
    "url": rstudioLogoUrl,
    "severity": "success"
});

export const ViewWarning = getStory({
    "url": rstudioLogoUrl,
    "severity": "warning"
});

export const ViewError = getStory({
    "url": rstudioLogoUrl,
    "severity": "error"
});

export const ViewPending = getStory({
    "url": rstudioLogoUrl,
    "severity": "pending"
});
