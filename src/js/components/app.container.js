import { connect } from 'react-redux';
import { actions as appActions } from "js/redux/app";
import App from './app';

const { applicationResize } = appActions;

const mapStateToProps = (state) => {

	return ({
		requestError: state.app.requestError,
		waiting: state.app.waiting,
		messageIntraining: state.app.messageIntraining,
		idep: state.user.IDEP,
	});
};

export default connect(mapStateToProps, { applicationResize })(App);
