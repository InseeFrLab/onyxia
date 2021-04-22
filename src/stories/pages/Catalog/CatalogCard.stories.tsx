


import { CatalogCard } from "app/components/pages/Catalog/CatalogCard";
import { sectionName } from "./sectionName";
import { getStoryFactory, logCallbacks } from "stories/geStory";
import rstudioImg from "stories/assets/img/rstudio.png";
import { css } from "tss-react";


const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { CatalogCard }
});

export default meta;

const className = css({ "maxWidth": 450 });

export const VueDefault = getStory({
    className,
    "serviceImageUrl": rstudioImg,
    "serviceTitle": "Service title",
    /* spell-checker: disable */
    "serviceDescription": `
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
    Pellentesque vel bibendum ex. Interdum et malesuada fames 
    ac ante ipsum primis in faucibus. Donec volutpat sem quis 
    justo varius`,
    /* spell-checker: enable */
    ...logCallbacks(["onRequestLaunch"])
});

export const VueNoDesc = getStory({
    className,
    "serviceImageUrl": rstudioImg,
    "serviceTitle": "Service title",
    "serviceDescription": "",
    ...logCallbacks(["onRequestLearnMore", "onRequestLaunch"])
});

export const VueNoLearnMore = getStory({
    className,
    "serviceImageUrl": rstudioImg,
    "serviceTitle": "Service title",
    /* spell-checker: disable */
    "serviceDescription": `
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
    Pellentesque vel bibendum ex. Interdum et malesuada fames 
    ac ante ipsum primis in faucibus. Donec volutpat sem quis 
    justo varius`,
    /* spell-checker: enable */
    ...logCallbacks(["onRequestLaunch"]),
    "onRequestLearnMore": undefined
});

