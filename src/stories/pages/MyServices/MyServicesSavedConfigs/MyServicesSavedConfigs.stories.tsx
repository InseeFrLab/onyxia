import {
    MyServicesSavedConfigs,
    Props,
} from "ui/components/pages/MyServices/MyServicesSavedConfigs";
import { sectionName } from "./sectionName";
import { getStoryFactory, logCallbacks } from "stories/getStory";
import rstudioImgUrl from "stories/assets/img/rstudio.png";
import { css } from "@emotion/css";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { MyServicesSavedConfigs },
});

export default meta;

const props: Props = {
    "className": css({ "width": 300 }),
    "isShortVariant": true,
    "savedConfigs": [1, 2, 3, 4, 5, 6, 7].map(i => {
        const link = { "href": `https://example.com/${i}`, "onClick": () => {} };

        const out = {
            "launchLink": link,
            "editLink": link,
            "logoUrl": rstudioImgUrl,
            "friendlyName": `RStudio ${i}`,
        };

        return out;
    }),
    ...logCallbacks(["callback", "onRequestToggleIsShortVariant"]),
};

export const VueShortVariant = getStory(props);

export const VueFullPage = getStory({
    ...props,
    "className": css({ "width": 800, "height": 300 }),
    "isShortVariant": false,
});
