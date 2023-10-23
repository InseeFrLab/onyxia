import { CatalogChartCard } from "ui/pages/catalog/CatalogChartCard";
import { sectionName } from "./sectionName";
import { getStoryFactory, logCallbacks } from "stories/getStory";
import rstudioImgUrl from "stories/assets/img/rstudio.png";
import { css } from "@emotion/css";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { CatalogChartCard },
    "defaultContainerWidth": 450
});

export default meta;

export const ViewDefault = getStory({
    "iconUrl": rstudioImgUrl,
    "chartNameWithHighlights": {
        "charArray": "package_name".normalize().split(""),
        "highlightedIndexes": [0, 1, 2, 3, 4, 5, 6]
    },
    /* spell-checker: disable */
    "chartDescriptionWithHighlights": {
        "charArray": `Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
Pellentesque vel bibendum ex. Interdum et malesuada fames 
ac ante ipsum primis in faucibus. Donec volutpat sem quis 
justo varius`
            .normalize()
            .split(""),
        "highlightedIndexes": [0, 1, 2, 3, 4, 5, 6]
    },
    /* spell-checker: enable */
    "projectHomepageUrl": "https://example.com",
    ...logCallbacks(["onRequestLaunch"])
});

export const ViewNoDesc = getStory({
    "iconUrl": rstudioImgUrl,
    "chartNameWithHighlights": {
        "charArray": "package_name".normalize().split(""),
        "highlightedIndexes": []
    },
    "chartDescriptionWithHighlights": {
        "charArray": ``.normalize().split(""),
        "highlightedIndexes": []
    },
    "projectHomepageUrl": "https://example.com",
    ...logCallbacks(["onRequestLearnMore", "onRequestLaunch"])
});

export const ViewNoLearnMore = getStory({
    "iconUrl": rstudioImgUrl,
    "chartNameWithHighlights": {
        "charArray": "package_name".normalize().split(""),
        "highlightedIndexes": []
    },
    /* spell-checker: disable */
    "chartDescriptionWithHighlights": {
        "charArray": `Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
Pellentesque vel bibendum ex. Interdum et malesuada fames 
ac ante ipsum primis in faucibus. Donec volutpat sem quis 
justo varius`
            .normalize()
            .split(""),
        "highlightedIndexes": []
    },
    /* spell-checker: enable */
    ...logCallbacks(["onRequestLaunch"]),
    "projectHomepageUrl": undefined
});

export const ViewScroll = getStory({
    "className": css({ "height": 308 }),
    "iconUrl": rstudioImgUrl,
    "chartNameWithHighlights": {
        "charArray": "package_name".normalize().split(""),
        "highlightedIndexes": []
    },
    /* spell-checker: disable */

    "chartDescriptionWithHighlights": {
        "charArray": `Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
Pellentesque vel bibendum ex. Interdum et malesuada fames 
ac ante ipsum primis in faucibus. Donec volutpat sem quis 
Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
Pellentesque vel bibendum ex. Interdum et malesuada fames 
ac ante ipsum primis in faucibus. Donec volutpat sem quis 
justo varius
        `
            .normalize()
            .split(""),
        "highlightedIndexes": []
    },
    /* spell-checker: enable */
    "projectHomepageUrl": undefined,
    ...logCallbacks(["onRequestLearnMore", "onRequestLaunch"])
});
