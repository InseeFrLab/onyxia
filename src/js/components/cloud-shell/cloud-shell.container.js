import { connect } from 'react-redux';
import CloudShell from './cloud-shell.component';
import {
	cloudShellChangeVisibility,
	refreshCloudShellStatus,
	requestDeleteMonService,
} from 'js/redux/actions';

const mapStateToProps = (state) => {
	const { active, status, url } = state.cloudShell;
	const idep = state.user.IDEP;
	return { active, status, url, idep };
};

const mapDispatchToProps = (dispatch) => ({
	changeVisibility: (visibility) =>
		dispatch(cloudShellChangeVisibility(visibility)),
	getShellStatus: () => dispatch(refreshCloudShellStatus()),
	deleteCloudShell: (idep) =>
		requestDeleteMonService({
			id: `cloudshell`,
		})(dispatch),
	// deleteCloudShell: (idep) => dispatch(supprimerGroupe(`/users/${idep}/cloudshell`))
});

export default connect(mapStateToProps, mapDispatchToProps)(CloudShell);
