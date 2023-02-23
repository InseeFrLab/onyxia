import { ExplorerUploadModal } from "ui/pages/MyFiles/Explorer/ExplorerUploadModal/ExplorerUploadModal";
import { sectionName } from "./sectionName";
import { getStoryFactory, logCallbacks } from "stories/getStory";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { ExplorerUploadModal }
});

export default meta;

export const view = getStory({
    "filesBeingUploaded": [
        {
            "directoryPath": "/a/b/c",
            "basename": "foo.csv",
            "size": 30_000_000,
            "uploadPercent": 52
        },
        {
            "directoryPath": "/a/b/c/d",
            "basename": "bar.csv",
            "size": 20_000_000,
            "uploadPercent": 23
        },
        {
            "directoryPath": "/a/b/c/d",
            "basename": "baz.csv",
            "size": 20_000_000,
            "uploadPercent": 23
        },
        {
            "directoryPath": "/a/b/c/d",
            "basename": "baz.csv",
            "size": 20_000_000,
            "uploadPercent": 23
        }
    ],
    "isOpen": true,
    ...logCallbacks(["onClose", "onFileSelected"])
});
