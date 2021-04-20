

import { SearchBar } from "app/components/pages/Catalog/SearchBar";
import { sectionName } from "./sectionName";
import { getStoryFactory, logCallbacks } from "stories/geStory";
import { css } from "tss-react";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { SearchBar }
});

export default meta;

const className = css({ "width": 400 });

export const Vue1 = getStory({
    className,
    ...logCallbacks([ "onSearchChange" ])
});

