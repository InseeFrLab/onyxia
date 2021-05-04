

import { CatalogExplorerSearchBar } from "app/components/pages/Catalog/CatalogExplorer/CatalogExplorerSearchBar";
import { sectionName } from "./sectionName";
import { getStoryFactory, logCallbacks } from "stories/geStory";
import { css } from "tss-react";
import { Evt } from "evt";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { CatalogExplorerSearchBar }
});

export default meta;

const className = css({ "width": 400 });

export const Vue1 = getStory({
    className,
    "search": "",
    "evtAction": new Evt(),
    ...logCallbacks([ "onSearchChange" ])
});

