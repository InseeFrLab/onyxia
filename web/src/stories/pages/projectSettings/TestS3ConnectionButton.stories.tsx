import { TestS3ConnectionButton } from "ui/pages/projectSettings/ProjectSettingsS3ConfigTab/TestS3ConnectionButton";
import { sectionName } from "./sectionName";
import { getStoryFactory, logCallbacks } from "stories/getStory";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { TestS3ConnectionButton }
});

export default meta;

export const NotTestedYet = getStory({
    "connectionTestStatus": {
        "stateDescription": "not tested yet",
        "isTestOngoing": false
    },
    ...logCallbacks(["onTestConnection"])
});

export const Ongoing = getStory({
    "connectionTestStatus": {
        "stateDescription": "not tested yet",
        "isTestOngoing": true
    },
    ...logCallbacks(["onTestConnection"])
});

export const Success = getStory({
    "connectionTestStatus": {
        "stateDescription": "success",
        "isTestOngoing": false
    },
    ...logCallbacks(["onTestConnection"])
});

export const Failure = getStory({
    "connectionTestStatus": {
        "stateDescription": "failed",
        "errorMessage": "Something went wrong",
        "isTestOngoing": false
    },
    ...logCallbacks(["onTestConnection"])
});
