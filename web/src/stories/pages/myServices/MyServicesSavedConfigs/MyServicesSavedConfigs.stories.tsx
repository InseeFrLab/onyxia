import {
    MyServicesRestorableConfigs,
    Props
} from "ui/pages/myServices/MyServicesRestorableConfigs";
import { sectionName } from "./sectionName";
import { getStoryFactory, logCallbacks, css } from "stories/getStory";
import rstudioImgUrl from "stories/assets/img/rstudio.png";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { MyServicesRestorableConfigs }
});

export default meta;

const props: Props = {
    "className": css({ "width": 300 }),
    "isShortVariant": true,
    "entries": [1, 2, 3, 4, 5, 6, 7].map(i => {
        const link = { "href": `https://example.com/${i}`, "onClick": () => {} };

        const out = {
            "restorableConfigIndex": i,
            "launchLink": link,
            "editLink": link,
            "chartIconUrl": rstudioImgUrl,
            "friendlyName": `RStudio ${i}`
        };

        return out;
    }),
    ...logCallbacks(["onRequestDelete", "onRequestToggleIsShortVariant"])
};

export const ViewShortVariant = getStory(props);

export const ViewFullPage = getStory({
    ...props,
    "className": css({ "width": 800, "height": 300 }),
    "isShortVariant": false
});
