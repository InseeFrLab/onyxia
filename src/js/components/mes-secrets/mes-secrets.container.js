import { connect } from 'react-redux';
import MesSecrets from './mes-secrets.component';
import { actions } from 'js/redux/store';

const {
	checkVaultStatus,
	getVaultSecretsList,
	getVaultSecret,
	updateVaultSecret,
	getUserInfo
}= actions;

const dispatchStateToProps = (state) => {
	const { sealedStatus, vaultSecretsList, vaultSecret } = state.secrets;
	const { user } = state;
	return { sealedStatus, vaultSecretsList, vaultSecret, getUserInfo, user };
};

export default connect(dispatchStateToProps, {
	checkVaultStatus,
	getVaultSecretsList,
	getVaultSecret,
	updateVaultSecret,
})(MesSecrets);
