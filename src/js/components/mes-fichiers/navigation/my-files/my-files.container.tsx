import { connect } from 'react-redux';
import MyFiles from './my-files.component';
import {
	actions
} from 'js/redux/store';

const { 
	loadBucketContent, 
	uploadFileToBucket, 
	removeObjectFromBucket, 
	startWaiting, 
	stopWaiting 
} = actions;

const mapStateToProps = (...[,props]: any[]) => {
	return { ...props };
};

export default connect(mapStateToProps, {
	loadBucketContent,
	uploadFileToBucket,
	removeObjectFromBucket,
	startWaiting,
	stopWaiting,
})(MyFiles as any);
