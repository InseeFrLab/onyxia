import {
    ExplorerFileOrDirectoryHeader,
    defaultProps,
} from "app/components/shared/Explorer/ExplorerFileOrDirectoryHeader";
import { sectionName } from "./sectionName";
import { getStoryFactory, logCallbacks } from "stories/geStory";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { ExplorerFileOrDirectoryHeader },
});

export default meta;

export const Vue1 = getStory({
    ...defaultProps,
    "kind": "file",
    "visualRepresentationOfAFile": "secret",
    "fileBasename": "mySecret",
    "date": new Date(),
    ...logCallbacks(["onBack"]),
});

export const Vue2 = getStory({
    ...defaultProps,
    "kind": "directory",
    "visualRepresentationOfAFile": "secret",
    "fileBasename": "mySecret",
    "date": new Date(1210166927304),
    ...logCallbacks(["onBack"]),
});
