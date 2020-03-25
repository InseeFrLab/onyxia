import { connect } from 'react-redux';
import NavBar from './nav-bar';
import {
	setAuthenticated,
	displayLogin,
	setRedirectUri,
	getUserInfo,
	logout,
	startVisite,
} from 'js/redux/actions';

const mapStateToProps = (state, ownProps) => {
	const {
		authenticated,
		redirectUri,
		displayLogin: login,
		screenType,
	} = state.app;
	return { authenticated, redirectUri, login, screenType };
};

const dispatchToProps = {
	setAuthenticated,
	displayLogin,
	setRedirectUri,
	getUserInfo,
	logout,
	startVisite,
};

export default connect(mapStateToProps, dispatchToProps)(NavBar);
