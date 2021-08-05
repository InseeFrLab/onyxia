import { MyServicesRoundLogo } from "app/components/pages/MyServices/MyServicesCards/MyServicesCard/MyServicesRoundLogo";
import { sectionName } from "./sectionName";
import { getStoryFactory } from "stories/geStory";
import rstudioLogoUrl from "stories/assets/img/rstudio.png";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { MyServicesRoundLogo },
});

export default meta;

export const VueGreen = getStory({
    "url": rstudioLogoUrl,
    "circleColor": "green",
});

export const VueGrey = getStory({
    "url": rstudioLogoUrl,
    "circleColor": "grey",
});

export const VueRed = getStory({
    "url": rstudioLogoUrl,
    "circleColor": "red",
});
