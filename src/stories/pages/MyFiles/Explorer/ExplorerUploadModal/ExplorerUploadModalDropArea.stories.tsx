import { ExplorerUploadModalDropArea } from "ui/components/pages/MyFiles/Explorer/ExplorerUploadModal/ExplorerUploadModalDropArea";
import { sectionName } from "./sectionName";
import { getStoryFactory, logCallbacks } from "stories/getStory";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { ExplorerUploadModalDropArea },
    "defaultContainerWidth": 300,
});

export default meta;

export const view = getStory({
    ...logCallbacks(["onFileSelected"]),
});
