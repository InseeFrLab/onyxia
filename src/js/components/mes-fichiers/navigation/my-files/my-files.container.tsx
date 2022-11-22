import { connect } from "react-redux";
import { MyFiles as MyFilesUnconnected } from "./my-files.component";
import { actions } from "js/redux/legacyActions";

const {
    loadBucketContent,
    uploadFileToBucket,
    removeObjectFromBucket,
    startWaiting,
    stopWaiting
} = actions;

export const MyFiles = connect(undefined, {
    loadBucketContent,
    uploadFileToBucket,
    removeObjectFromBucket,
    startWaiting,
    stopWaiting
})(MyFilesUnconnected);
