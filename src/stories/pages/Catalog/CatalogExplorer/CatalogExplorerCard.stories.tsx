


import { CatalogExplorerCard } from "app/components/pages/Catalog/CatalogExplorer/CatalogExplorerCard";
import { sectionName } from "./sectionName";
import { getStoryFactory, logCallbacks } from "stories/geStory";
import rstudioImgUrl from "stories/assets/img/rstudio.png";
import { css, cx } from "tss-react";


const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { CatalogExplorerCard }
});

export default meta;

const className = css({ "maxWidth": 450 });

export const VueDefault = getStory({
    className,
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

export const VueNoDesc = getStory({
    className,
    "packageIconUrl": rstudioImgUrl,
    "packageName": "package_name",
    "packageDescription": "",
    "packageHomeUrl": "https://example.com",
    ...logCallbacks(["onRequestLearnMore", "onRequestLaunch"])
});

export const VueNoLearnMore = getStory({
    className,
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

export const VueScroll = getStory({
    "className": cx(className, css({ "height": 308 })),
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

