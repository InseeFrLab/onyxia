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
    "chartVersion": "4.1.1",
    "contributeUrl": "#",
    "termsLink": {
        "href": "https://example.com",
        "onClick": () => {}
    }
});
