import { connect } from 'react-redux';
import { startWaiting, stopWaiting } from 'js/redux/actions';
import MyFile from './my-file.component';

export default connect(undefined, {
	startWaiting,
	stopWaiting,
})(MyFile);
