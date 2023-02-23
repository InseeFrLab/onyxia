import {
    CatalogExplorerCards,
    Props
} from "ui/pages/Catalog/CatalogExplorer/CatalogExplorerCards";
import { sectionName } from "../sectionName";
import { getStoryFactory, logCallbacks } from "stories/getStory";
import rstudioImg from "stories/assets/img/rstudio.png";
import { css } from "@emotion/css";
import { id } from "tsafe/id";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { CatalogExplorerCards },
    "defaultContainerWidth": 1550
});

export default meta;

const className = css({ "height": 700 });

const keywords = ["python", "RStudio", "Elastic search"];

const packages = new Array(20).fill(0).map((...[, i]) =>
    id<Props["packages"][number]>({
        "packageIconUrl": rstudioImg,
        "packageName": `${keywords[i % keywords.length]} ${i}`,
        /* spell-checker: disable */
        "packageDescription":
            "Service description" +
            (i === 1
                ? `
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
    Pellentesque vel bibendum ex. Interdum et malesuada fames.
        `
                : ""),
        "packageHomeUrl": "https://example.com",
        "catalogId": "helm-charts-datascience"
        /* spell-checker: enable */
    })
);

export const ViewDefault = getStory({
    className,
    packages,
    "scrollableDivRef": { "current": null },
    "search": "",
    "notShownPackageCount": 0,
    "selectedCatalogId": "helm-charts-datascience",
    "catalogs": [
        {
            "id": "helm-charts-datascience",
            "name": "Helm charts datascience"
        },
        {
            "id": "helm-charts-trainings",
            "name": "Helm charts trainings"
        }
    ],
    /* spell-checker: enable */
    ...logCallbacks([
        "onSearchChange",
        "onRequestLaunch",
        "onRequestRevealPackagesNotShown",
        "onSelectedCatalogIdChange"
    ])
});
