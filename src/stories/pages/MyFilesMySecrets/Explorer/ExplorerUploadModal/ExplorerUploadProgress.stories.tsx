import { ExplorerUploadProgress } from "ui/components/pages/MyFilesMySecrets/Explorer/ExplorerUploadModal/ExplorerUploadProgress";
import { sectionName } from "./sectionName";
import { getStoryFactory } from "stories/getStory";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { ExplorerUploadProgress },
    "defaultContainerWidth": 400,
});

export default meta;

export const view = getStory({
    "basename": "nyr_data.csv",
    "percentUploaded": 72,
    "fileSize": 7_800_000,
});
