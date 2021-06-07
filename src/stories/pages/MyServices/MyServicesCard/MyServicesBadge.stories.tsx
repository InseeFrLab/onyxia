

import { MyServicesBadge } from "app/components/pages/MyServices/MyServicesCard/MyServicesBadge";
import { sectionName } from "./sectionName";
import { getStoryFactory } from "stories/geStory";
import rstudioImgUrl from "stories/assets/img/rstudio.png";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { MyServicesBadge }
});

export default meta;

export const VueGreen = getStory({
    "src": rstudioImgUrl,
    "circleColor": "green"
});

export const VueGrey = getStory({
    "src": rstudioImgUrl,
    "circleColor": "grey"
});

export const VueRed = getStory({
    "src": rstudioImgUrl,
    "circleColor": "red"
});

