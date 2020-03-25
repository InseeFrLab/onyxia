import { connect } from 'react-redux';
import MyFiles from './my-files.component';
import { startWaiting, stopWaiting } from 'js/redux/actions';
import {
	loadBucketContent,
	uploadFileToBucket,
	removeObjectFromBucket,
} from 'js/redux/actions';

const mapStateToProps = (state, props) => {
	return { ...props };
};

export default connect(mapStateToProps, {
	loadBucketContent,
	uploadFileToBucket,
	removeObjectFromBucket,
	startWaiting,
	stopWaiting,
})(MyFiles);
