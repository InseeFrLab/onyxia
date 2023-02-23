import { ExplorerUploadProgress } from "ui/pages/MyFiles/Explorer/ExplorerUploadModal/ExplorerUploadProgress";
import { sectionName } from "./sectionName";
import { getStoryFactory, logCallbacks } from "stories/getStory";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { ExplorerUploadProgress },
    "defaultContainerWidth": 400
});

export default meta;

export const viewProgress = getStory({
    "basename": "nyr_data.csv",
    "percentUploaded": 72,
    "fileSize": 7_800_000,
    "isFailed": false
});

export const viewFailed = getStory({
    "basename": "nyr_data.csv",
    "percentUploaded": 72,
    "fileSize": 7_800_000,
    "isFailed": true,
    ...logCallbacks(["onClick"])
});

export const viewSuccess = getStory({
    "basename": "nyr_data.csv",
    "percentUploaded": 100,
    "fileSize": 7_800_000,
    "isFailed": false
});
