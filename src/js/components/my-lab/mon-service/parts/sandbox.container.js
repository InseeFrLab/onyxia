import { connect } from "react-redux";
import Sandbox from "./sandbox.component";
import { browseSandbox, uploadFile, downloadFile } from "js/redux/actions";
import { withRouter } from "react-router-dom";

const mapStateToProps = state => {
  return {
    sandbox: state.myLab.sandbox,
    fileContent: state.myLab.fileContent
  };
};

const mapDispatchToProps = dispatch => {
  return {
    browseSandbox: (taskId, path) => dispatch(browseSandbox(taskId, path)),
    uploadFile: (taskId, path) => dispatch(uploadFile(taskId, path)),
    downloadFile: (taskId, path, download) =>
      dispatch(downloadFile(taskId, path, download))
  };
};

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(Sandbox)
);
