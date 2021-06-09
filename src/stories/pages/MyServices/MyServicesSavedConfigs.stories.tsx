
import { MyServicesSavedConfigs, Props } from "app/components/pages/MyServices/MyServicesSavedConfigs";
import { sectionName } from "./sectionName";
import { getStoryFactory, logCallbacks } from "stories/geStory";
import rstudioImgUrl from "stories/assets/img/rstudio.png";
import { css } from "tss-react";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { MyServicesSavedConfigs }
});

export default meta;

const props: Props= {
    "className": css({ "width": 300 }),
    "isShortVariant": true,
    "maxConfigCountInShortVariant": 5,
    "savedConfigs": [1, 2, 3, 4, 5, 6, 7].map(
        i => ({
            "logoUrl": rstudioImgUrl,
            "friendlyName": `RStudio ${i}`,
            "restoreConfigurationUrl": `https://example.com/${i}`
        })
    ),
    ...logCallbacks(["callback", "onRequestToggleIsShortVariant"])
};

export const VueShortVariant = getStory(props);

export const VueFullPage = getStory({
    ...props,
    "className": css({ "width": 800, "height": 300 }),
    "isShortVariant": false
});
