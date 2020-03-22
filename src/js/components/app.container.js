import { connect } from 'react-redux';
import { applicationResize } from 'js/redux/actions';
import App from './app';

const mapStateToProps = state => ({
	requestError: state.app.requestError,
	waiting: state.app.waiting,
	messageInformation: state.app.messageInformation,
});

export default connect(
	mapStateToProps,
	{ applicationResize }
)(App);
