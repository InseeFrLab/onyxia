

import { ExplorerFileHeader, defaultProps } from "app/components/Explorer/ExplorerFileHeader";
import { sectionName } from "./sectionName";
import { getStoryFactory, logCallbacks } from "stories/geStory";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { ExplorerFileHeader }
});

export default meta;

export const Vue1 = getStory({
    ...defaultProps,
    "visualRepresentationOfAFile": "secret",
    "fileBasename": "mySecret",
    "date": new Date(),
    ...logCallbacks(["onBack"])
});

export const Vue2 = getStory({
    ...defaultProps,
    "visualRepresentationOfAFile": "secret",
    "fileBasename": "mySecret",
    "date": new Date(1210166927304),
    ...logCallbacks(["onBack"])
});
