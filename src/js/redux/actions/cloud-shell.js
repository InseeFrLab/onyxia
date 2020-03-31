import * as constantes from './constantes';
import { axiosAuth } from 'js/utils';
import api from 'js/redux/api';
import { creerNouveauService } from './my-lab';
import getDefaultOptions from 'js/universe/universeContractFiller';
import { getMinioToken } from 'js/minio-client';
import { getVaultToken } from 'js/vault-client';

export const cloudShellChangeVisibility = (visibility) => ({
	type: constantes.CLOUDSHELL_VISIBILITY_CHANGE,
	payload: { visibility },
});

export const refreshCloudShellStatus = () => (dispatch) => {
	axiosAuth(`${api.cloudShell}`)
		.then((data) => {
			dispatch({
				type: constantes.CLOUDSHELL_STATUS_CHANGE,
				payload: data,
			});
			if (data.status === 'DOWN') {
				Promise.all([getVaultToken(), getMinioToken()])
					.then((_) => {
						debugger;
						creerNouveauService(
							data.packageToDeploy,
							getDefaultOptions(data.packageToDeploy.config.properties)
						)(dispatch);
					})
					.catch((_) => {
						debugger;
						creerNouveauService(
							data.packageToDeploy,
							getDefaultOptions(data.packageToDeploy.config.properties)
						)(dispatch);
					});
			}
		})
		.catch((err) => console.log(err));
};
