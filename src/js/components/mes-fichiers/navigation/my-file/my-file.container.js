import { connect } from 'react-redux';
import { actions } from 'js/redux/store';
import MyFile from './my-file.component';

const { startWaiting, stopWaiting } = actions;

export default connect(undefined, {
	startWaiting,
	stopWaiting,
})(MyFile);
