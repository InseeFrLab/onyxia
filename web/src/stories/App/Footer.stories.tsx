import { Footer } from "ui/App/Footer";
import { getStoryFactory } from "stories/getStory";
import { sectionName } from "./sectionName";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { Footer },
    "defaultContainerWidth": 1000
});

export default meta;

export const View1 = getStory({
    "onyxiaVersion": {
        "number": "v3.0.1",
        "url": "https://github.com/InseeFrLab/onyxia/tree/v3.0.1/helm-chart"
    },
    "contributeUrl": "#",
    "termsLink": {
        "href": "https://example.com",
        "onClick": () => {}
    }
});
