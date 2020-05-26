import { connect } from 'react-redux';
import CloudShell from './cloud-shell.component';
import {
	refreshCloudShellStatus,
	requestDeleteMonService,
} from 'js/redux/actions';

const mapStateToProps = (state, props) => {
	const { status, url } = state.cloudShell;
	const { authenticated } = state.app;
	const { user } = state;
	return { ...props, status, url, authenticated, user };
};

const mapDispatchToProps = (dispatch) => ({
	getShellStatus: (user) => dispatch(refreshCloudShellStatus(user)),
	deleteCloudShell: (idep) =>
		requestDeleteMonService({
			id: `cloudshell`,
		})(dispatch),
	// deleteCloudShell: (idep) => dispatch(supprimerGroupe(`/users/${idep}/cloudshell`))
});

export default connect(mapStateToProps, mapDispatchToProps)(CloudShell);
