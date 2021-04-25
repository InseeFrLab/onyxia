


import { CatalogCards } from "app/components/pages/Catalog/CatalogCards";
import { sectionName } from "./sectionName";
import { getStoryFactory, logCallbacks } from "stories/geStory";
import rstudioImg from "stories/assets/img/rstudio.png";
import { css } from "tss-react";


const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { CatalogCards }
});

export default meta;

const className = css({ "width": 1550, "height": 700 });


const keywords = [ "python", "RStudio", "Elastic search" ];

const cardsContent = (new Array(20).fill(0)).map((...[, i]) => ({
    "serviceImageUrl": rstudioImg,
    "serviceTitle": `${keywords[i%keywords.length]} ${i}`,
    /* spell-checker: disable */
    "serviceDescription": 
    "Service description" + (
        i === 1 ? `
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
    Pellentesque vel bibendum ex. Interdum et malesuada fames 
    ac ante ipsum primis in faucibus. Donec volutpat sem quis 
    lorem ipsum dolor sit amet, consectetur adipiscing elit. 
    Pellentesque vel bibendum ex. Interdum et malesuada fames 
    ac ante ipsum primis in faucibus. Donec volutpat sem quis 
    lorem ipsum dolor sit amet, consectetur adipiscing elit. 
    Pellentesque vel bibendum ex. Interdum et malesuada fames 
    ac ante ipsum primis in faucibus. Donec volutpat sem quis.
        `: ""
    ),
    /* spell-checker: enable */
    "doDisplayLearnMore": true
}));

export const VueDefault = getStory({
    className,
    cardsContent,
    "search": "",
    /* spell-checker: enable */
    ...logCallbacks(["onRequestLaunch", "onRequestLearnMore", "onClearSearch"])
});
