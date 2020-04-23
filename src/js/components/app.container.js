import { connect } from 'react-redux';
import { applicationResize } from 'js/redux/actions';
import App from './app';

const mapStateToProps = (state) => ({
	requestError: state.app.requestError,
	waiting: state.app.waiting,
	messageIntraining: state.app.messageIntraining,
	idep: state.user.IDEP,
});

export default connect(mapStateToProps, { applicationResize })(App);
