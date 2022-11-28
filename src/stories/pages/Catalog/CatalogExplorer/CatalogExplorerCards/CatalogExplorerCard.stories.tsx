import { CatalogExplorerCard } from "ui/components/pages/Catalog/CatalogExplorer/CatalogExplorerCards/CatalogExplorerCard";
import { sectionName } from "./sectionName";
import { getStoryFactory, logCallbacks } from "stories/getStory";
import rstudioImgUrl from "stories/assets/img/rstudio.png";
import { css } from "@emotion/css";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { CatalogExplorerCard },
    "defaultContainerWidth": 450
});

export default meta;

export const ViewDefault = getStory({
    "packageIconUrl": rstudioImgUrl,
    "packageName": "package_name",
    /* spell-checker: disable */
    "packageDescription": `
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
    Pellentesque vel bibendum ex. Interdum et malesuada fames 
    ac ante ipsum primis in faucibus. Donec volutpat sem quis 
    justo varius`,
    /* spell-checker: enable */
    "packageHomeUrl": "https://example.com",
    ...logCallbacks(["onRequestLaunch"])
});

export const ViewNoDesc = getStory({
    "packageIconUrl": rstudioImgUrl,
    "packageName": "package_name",
    "packageDescription": "",
    "packageHomeUrl": "https://example.com",
    ...logCallbacks(["onRequestLearnMore", "onRequestLaunch"])
});

export const ViewNoLearnMore = getStory({
    "packageIconUrl": rstudioImgUrl,
    "packageName": "package_name",
    /* spell-checker: disable */
    "packageDescription": `
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
    Pellentesque vel bibendum ex. Interdum et malesuada fames 
    ac ante ipsum primis in faucibus. Donec volutpat sem quis 
    justo varius`,
    /* spell-checker: enable */
    ...logCallbacks(["onRequestLaunch"]),
    "packageHomeUrl": undefined
});

export const ViewScroll = getStory({
    "className": css({ "height": 308 }),
    "packageIconUrl": rstudioImgUrl,
    "packageName": "Service title",
    /* spell-checker: disable */
    "packageDescription": `
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
    Pellentesque vel bibendum ex. Interdum et malesuada fames 
    ac ante ipsum primis in faucibus. Donec volutpat sem quis 
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
    Pellentesque vel bibendum ex. Interdum et malesuada fames 
    ac ante ipsum primis in faucibus. Donec volutpat sem quis 
    justo varius`,
    /* spell-checker: enable */
    "packageHomeUrl": undefined,
    ...logCallbacks(["onRequestLearnMore", "onRequestLaunch"])
});
