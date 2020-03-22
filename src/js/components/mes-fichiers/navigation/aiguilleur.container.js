import { connect } from "react-redux";
import NavigationFiles from "./aiguilleur.component";
import {
  loadBucketContent,
  loadUserBuckets,
  getUserInfo,
  startWaiting,
  stopWaiting
} from "js/redux/actions";

const mapStateToProps = state => {
  const {
    currentObjects: objets,
    currentDirectories: directories,
    userBuckets: buckets
  } = state.mesFichiers;
  const { user } = state;
  return { objets, directories, buckets, user };
};

export default connect(mapStateToProps, {
  loadBucketContent,
  loadUserBuckets,
  getUserInfo,
  startWaiting,
  stopWaiting
})(NavigationFiles);
