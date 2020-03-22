import { connect } from "react-redux";
import fileViewer from "./fileviewer.component";

const mapStateToProps = state => ({ fileContent: state.myLab.fileContent });

export default connect(mapStateToProps)(fileViewer);
